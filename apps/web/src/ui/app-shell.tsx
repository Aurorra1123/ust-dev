import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { logout, refreshSession } from "../lib/api";
import { useSessionStore } from "../store/session-store";

export function AppShell() {
  const navigate = useNavigate();
  const sessionStatus = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const setAnonymous = useSessionStore((state) => state.setAnonymous);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (sessionStatus !== "unknown") {
      return;
    }

    let cancelled = false;

    void refreshSession().catch(() => {
      if (!cancelled) {
        setAnonymous();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, setAnonymous]);

  const navigationItems = useMemo(() => {
    const baseItems = [
      { label: "总览", to: "/" },
      { label: "学术空间", to: "/spaces" },
      { label: "体育设施", to: "/sports" },
      { label: "校园活动", to: "/activities" }
    ];

    if (sessionStatus === "authenticated") {
      baseItems.push({ label: "我的订单", to: "/orders" });
    }

    if (user?.role === "admin") {
      baseItems.push({ label: "管理后台", to: "/admin" });
    }

    return baseItems;
  }, [sessionStatus, user?.role]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-sand text-ink">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6">
        <header className="rounded-[28px] bg-gradient-to-r from-ink via-moss to-ink px-6 py-6 text-white shadow-panel">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                CampusBook Platform
              </p>
              <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
                校园预约与活动平台演示站点
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                当前前端已接入真实登录、预约、抢票、订单和最小管理能力。
                用户与管理员共享同一站点，但按角色展示不同入口。
              </p>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-white/90 backdrop-blur">
              <p>前端入口：campusbook.top / www.campusbook.top</p>
              <p className="mt-1">后端入口：api.campusbook.top</p>
              <div className="mt-4 border-t border-white/15 pt-4">
                {sessionStatus === "authenticated" && user ? (
                  <>
                    <p className="font-medium">{user.email}</p>
                    <p className="mt-1 text-white/70">
                      当前身份：{user.role === "admin" ? "管理员" : "普通用户"}
                    </p>
                    <button
                      type="button"
                      className="mt-3 rounded-full border border-white/25 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
                      onClick={() => void handleLogout()}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? "退出中" : "退出登录"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-medium">当前未登录</p>
                    <p className="mt-1 text-white/70">
                      可用演示账号：demo@campusbook.top / admin@campusbook.top
                    </p>
                    <Link
                      to="/login"
                      className="mt-3 inline-flex rounded-full border border-white/25 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
                    >
                      前往登录
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {sessionStatus === "unknown" ? (
          <div className="mt-4 rounded-3xl border border-moss/20 bg-mist px-4 py-3 text-sm text-ink/75">
            正在尝试通过 refresh token 恢复登录态。
          </div>
        ) : null}

        <nav className="mt-6 flex flex-wrap gap-3">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-full border px-4 py-2 text-sm transition",
                  isActive
                    ? "border-ember bg-ember text-white"
                    : "border-ink/15 bg-white/80 text-ink hover:border-moss hover:text-moss"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="mt-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
