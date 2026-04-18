import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSessionStore } from "../store/session-store";

function RouteGateMessage({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] bg-white px-6 py-10 text-center shadow-panel">
      <p className="text-sm uppercase tracking-[0.3em] text-moss">Session</p>
      <p className="mt-4 text-lg font-semibold text-ink">{message}</p>
    </div>
  );
}

export function PublicOnlyRoute() {
  const status = useSessionStore((state) => state.status);

  if (status === "unknown") {
    return <RouteGateMessage message="正在恢复登录态" />;
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function RequireAuth() {
  const location = useLocation();
  const status = useSessionStore((state) => state.status);

  if (status === "unknown") {
    return <RouteGateMessage message="正在恢复登录态" />;
  }

  if (status !== "authenticated") {
    const redirect = encodeURIComponent(
      `${location.pathname}${location.search}${location.hash}`
    );
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}

export function RequireAdmin() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  if (status === "unknown") {
    return <RouteGateMessage message="正在恢复登录态" />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/login?redirect=%2Fadmin" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
