import { Redirect } from "expo-router";

import { AnimatedSplash } from "../components/AnimatedSplash";
import { useAuth } from "../lib/auth-context";
import { useResidentMe } from "../lib/resident-queries";

export default function SplashGate() {
  const { status, logout } = useAuth();

  const residentQuery = useResidentMe(status === "signed-in");

  if (status === "checking" || (status === "signed-in" && residentQuery.isPending)) {
    return <AnimatedSplash />;
  }

  if (status === "signed-out") {
    return <Redirect href="/login" />;
  }

  // Signed in, but the stored token no longer resolves to a valid account
  // (e.g. rejected after login, or revoked) — the request interceptor's
  // refresh attempt already failed by this point, so treat it as signed out.
  if (residentQuery.isError) {
    logout();
    return <Redirect href="/login" />;
  }

  if (residentQuery.data?.verification_status === "pending") {
    return <Redirect href="/pending" />;
  }

  return <Redirect href="/home" />;
}
