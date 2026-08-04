"""
Sunset calculation for Maghrib.

WHY THIS IS COMPUTED LOCALLY, NOT FETCHED FROM AN API
-----------------------------------------------------
Sunset is a solved astronomical calculation, not live data. It depends on
nothing but the date and the coordinates, so fetching it over the network
would add, for zero accuracy benefit:
  - a network round trip on a request that is otherwise pure DB reads
  - a hard failure mode (API down / rate limited / DNS fails -> Maghrib
    silently breaks again, which is exactly the bug being fixed)
  - an outbound dependency that can be deprecated or start charging
  - a caching layer to write and get wrong

WHY `astral` RATHER THAN HAND-ROLLED MATH
-----------------------------------------
A hand-written implementation of the NOAA/Meeus sunrise equation was tried
first and produced badly wrong results (London's midsummer sunset came out
as 9:21 AM instead of 9:21 PM). Sunset math has enough sign and convention
traps that a small, pure-Python, well-tested library is the right call.
`astral` is verified here against a known reference: London midsummer
sunset 9:21 PM, and 7:07 PM for this society's coordinates.

A FIXED UTC OFFSET, NOT A NAMED TIMEZONE
----------------------------------------
Pakistan is UTC+5 year-round with no DST, so there is nothing for a tz
database to resolve. Using a fixed offset also avoids depending on system
tzdata being present in the deployment image.

A FAILURE HERE MUST NOT TAKE THE API DOWN
-----------------------------------------
`astral` is imported lazily inside the function, not at module scope. A
module-scope `from astral import Observer` meant that if the dependency was
ever missing from a deployment, the import chain
    app.main -> prayer_timings -> prayer_timing_service -> sunset_service
failed at startup and EVERY endpoint returned 500 — auth, complaints, the
lot — because of an optional convenience feature. That actually happened.
Now a missing/broken astral just makes sunset unavailable, and Maghrib
falls back to whatever the admin stored.
"""
import logging
from datetime import date, time, timedelta, timezone

logger = logging.getLogger(__name__)


def sunset_local(
    on: date, latitude: float, longitude: float, utc_offset_hours: float
) -> time | None:
    """
    Local wall-clock sunset time, or None if it cannot be determined —
    either because the sun does not set that day (polar summer; impossible
    at this project's latitude but handled rather than raising) or because
    the astronomy library is unavailable.

    `longitude` is positive EAST, negative west — the usual convention for
    coordinates as normally quoted.
    """
    try:
        from astral import Observer
        from astral.sun import sunset as _astral_sunset
    except ImportError:
        logger.warning("astral is not installed — Maghrib will fall back to its stored value.")
        return None

    try:
        utc_dt = _astral_sunset(Observer(latitude, longitude), on, tzinfo=timezone.utc)
    except ValueError:
        # astral raises for latitudes/dates where the sun never sets.
        return None
    except Exception as exc:
        logger.warning("Sunset calculation failed unexpectedly: %s", exc)
        return None

    return (utc_dt + timedelta(hours=utc_offset_hours)).time()


def format_12h(t: time) -> str:
    """Formats as e.g. '7:07 PM', matching how prayer times are stored/displayed."""
    period = "AM" if t.hour < 12 else "PM"
    hour_12 = t.hour % 12 or 12
    return f"{hour_12}:{t.minute:02d} {period}"
