r"""
Copy all data from one EHS Next database to another.

WHY THIS EXISTS
---------------
The usual route (`supabase db dump` / `pg_dump`) needs either Docker Desktop
or a local PostgreSQL client whose version matches the server. Neither is
required here: the schema is already fully described by this project's own
Alembic migrations, so the target database can build its own schema and this
script only has to move the ROWS. It uses SQLAlchemy and psycopg, which are
already in requirements.txt.

HOW TO USE IT
-------------
    # 1. Create the schema on the NEW database first.
    $env:DATABASE_URL="<NEW_DATABASE_URL>"
    .\.venv\Scripts\python.exe -m alembic upgrade head

    # 2. Copy the data across.
    $env:SOURCE_DATABASE_URL="<OLD_DATABASE_URL>"
    $env:TARGET_DATABASE_URL="<NEW_DATABASE_URL>"
    .\.venv\Scripts\python.exe -m scripts.migrate_database

    # Add --dry-run first to see what WOULD be copied without writing.

WHAT IT HANDLES
---------------
* Foreign-key ordering. Tables are copied parents-first using SQLAlchemy's
  own topological sort, so a complaint is never inserted before the resident
  it belongs to.
* Sequence resync. Rows are copied with their original primary keys, which
  leaves each table's ID sequence still sitting at 1. Without resetting it,
  the very first complaint filed after the migration fails with a duplicate
  key error. This is the single easiest step to forget and the most
  confusing to debug afterwards.
* alembic_version is deliberately skipped, because step 1 above already set
  it correctly on the target.
* Refuses to touch a target that already contains data, unless --force is
  given, so it cannot silently double-insert if run twice.
* Verifies row counts per table at the end and exits non-zero on mismatch.
"""
import os
import sys

from sqlalchemy import create_engine, func, inspect, select, text

# Importing Base pulls in every model, which is what populates the metadata
# used for table discovery and FK-aware ordering.
from app.core.database import Base
import app.models  # noqa: F401  (registers all models on Base.metadata)

BATCH = 500
SKIP_TABLES = {"alembic_version"}


def normalize(url: str) -> str:
    """Match the app's own scheme handling so the psycopg3 driver is used."""
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


def main() -> int:
    dry_run = "--dry-run" in sys.argv
    force = "--force" in sys.argv

    src_url = os.environ.get("SOURCE_DATABASE_URL")
    dst_url = os.environ.get("TARGET_DATABASE_URL")
    if not src_url or not dst_url:
        print("ERROR: set both SOURCE_DATABASE_URL and TARGET_DATABASE_URL.")
        return 1
    if normalize(src_url) == normalize(dst_url):
        print("ERROR: source and target are the same database. Refusing to run.")
        return 1

    src = create_engine(normalize(src_url))
    dst = create_engine(normalize(dst_url))

    # Parents before children — SQLAlchemy sorts metadata tables by FK dependency.
    tables = [t for t in Base.metadata.sorted_tables if t.name not in SKIP_TABLES]

    print(f"{'DRY RUN - ' if dry_run else ''}Migrating {len(tables)} tables\n")

    # --- Confirm the target schema actually exists before touching anything.
    dst_tables = set(inspect(dst).get_table_names())
    missing = [t.name for t in tables if t.name not in dst_tables]
    if missing:
        print("ERROR: target is missing tables: " + ", ".join(missing))
        print("       Run 'alembic upgrade head' against the target first.")
        return 1

    # --- Refuse to write into a target that already has rows.
    if not dry_run and not force:
        existing = []
        with dst.connect() as c:
            for t in tables:
                n = c.execute(select(func.count()).select_from(t)).scalar_one()
                if n:
                    existing.append(f"{t.name} ({n})")
        if existing:
            print("ERROR: target already contains data: " + ", ".join(existing))
            print("       Re-run with --force only if you intend to add to it.")
            return 1

    # --- Copy, table by table, in dependency order.
    summary = []
    for t in tables:
        with src.connect() as sc:
            rows = [dict(r) for r in sc.execute(select(t)).mappings()]

        if not rows:
            print(f"  {t.name:<28} 0 rows (empty, skipped)")
            summary.append((t.name, 0))
            continue

        if not dry_run:
            with dst.begin() as dc:
                for i in range(0, len(rows), BATCH):
                    dc.execute(t.insert(), rows[i:i + BATCH])

        print(f"  {t.name:<28} {len(rows)} rows{' (not written - dry run)' if dry_run else ''}")
        summary.append((t.name, len(rows)))

    if dry_run:
        print(f"\nDry run complete. {sum(n for _, n in summary)} rows would be copied.")
        return 0

    # --- Resync sequences. Skipping this is what makes the first insert after
    # --- a migration blow up with a duplicate key error.
    print("\nResyncing ID sequences:")
    resynced = 0
    with dst.begin() as dc:
        if dc.dialect.name == "postgresql":
            for t in tables:
                for col in t.primary_key.columns:
                    seq = dc.execute(
                        text("SELECT pg_get_serial_sequence(:tbl, :col)"),
                        {"tbl": t.name, "col": col.name},
                    ).scalar()
                    if not seq:
                        continue
                    max_id = dc.execute(select(func.max(col)).select_from(t)).scalar()
                    if max_id is None:
                        continue
                    dc.execute(text("SELECT setval(:seq, :val)"), {"seq": seq, "val": int(max_id)})
                    print(f"  {t.name:<28} next ID -> {int(max_id) + 1}")
                    resynced += 1
        else:
            print("  (not PostgreSQL - nothing to resync)")
    if resynced == 0:
        print("  (no sequences needed resyncing)")

    # --- Verify: counts on both sides must match exactly.
    print("\nVerifying row counts:")
    ok = True
    with src.connect() as sc, dst.connect() as dc:
        for t in tables:
            a = sc.execute(select(func.count()).select_from(t)).scalar_one()
            b = dc.execute(select(func.count()).select_from(t)).scalar_one()
            mark = "OK " if a == b else "BAD"
            if a != b:
                ok = False
            print(f"  [{mark}] {t.name:<28} source={a:<6} target={b}")

    print()
    if ok:
        print(f"SUCCESS: all {len(tables)} tables match. "
              f"{sum(n for _, n in summary)} rows migrated.")
        return 0
    print("FAILED: row counts do not match. Do NOT switch production over.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
