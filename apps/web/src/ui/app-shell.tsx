import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { logout, refreshSession } from "../lib/api/auth-api";
import { localeText } from "../lib/locale";
import { useLocaleStore } from "../store/locale-store";
import { useSessionStore } from "../store/session-store";

export function AppShell() {
  const navigate = useNavigate();
  const sessionStatus = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const setAnonymous = useSessionStore((state) => state.setAnonymous);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
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

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const navigationItems = useMemo(() => {
    if (user?.role === "admin") {
      return [{ label: localeText(locale, "教师工作台", "Teacher Workspace"), to: "/admin" }];
    }

    if (sessionStatus !== "authenticated") {
      return [];
    }

    return [
      { label: localeText(locale, "首页", "Home"), to: "/" },
      { label: localeText(locale, "体育", "Sports"), to: "/sports" },
      { label: localeText(locale, "学术", "Study"), to: "/spaces" },
      { label: localeText(locale, "活动", "Activities"), to: "/activities" },
      {
        label: localeText(locale, "报修工单", "Service Requests"),
        to: "/service-requests"
      },
      { label: localeText(locale, "我的订单", "Orders"), to: "/orders" }
    ];
  }, [locale, sessionStatus, user?.role]);

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
      <a href="#main-content" className="skip-link">
        {localeText(locale, "跳到主要内容", "Skip to main content")}
      </a>
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="text-lg font-semibold text-ink">
            {localeText(locale, "CampusBook 智约校园", "CampusBook")}
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-navy/10 bg-sand p-1">
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  locale === "zh-CN" ? "bg-ember text-white" : "text-slate"
                }`}
                onClick={() => setLocale("zh-CN")}
                aria-label={localeText(
                  locale,
                  "切换到中文界面",
                  "Switch to Chinese interface"
                )}
                aria-pressed={locale === "zh-CN"}
              >
                {localeText(locale, "中文", "Chinese")}
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  locale === "en" ? "bg-ember text-white" : "text-slate"
                }`}
                onClick={() => setLocale("en")}
                aria-label={localeText(
                  locale,
                  "切换到英文界面",
                  "Switch to English interface"
                )}
                aria-pressed={locale === "en"}
              >
                {localeText(locale, "英文", "English")}
              </button>
            </div>

            {sessionStatus === "authenticated" && user ? (
              <button
                type="button"
                className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
              >
                {isLoggingOut
                  ? localeText(locale, "退出中", "Signing Out")
                  : localeText(locale, "退出登录", "Sign Out")}
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-ember px-4 py-2 text-sm text-white transition hover:bg-ember/90"
              >
                {localeText(locale, "登录", "Sign In")}
              </Link>
            )}
          </div>
        </div>

        {navigationItems.length > 0 ? (
          <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
            <nav
              className="flex gap-2 overflow-x-auto"
              aria-label={localeText(locale, "主导航", "Primary navigation")}
            >
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={
                    item.to === "/" || item.to === "/orders"
                  }
                  className={({ isActive }) =>
                    [
                      "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition",
                      isActive
                        ? "border-ember bg-ember text-white"
                        : "border-navy/10 bg-sand text-ink hover:border-moss"
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {sessionStatus === "unknown" ? (
          <div className="rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-slate">
            {localeText(locale, "正在恢复登录状态。", "Restoring your session.")}
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
