import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { logout, refreshSession } from "../lib/api";
import { isEnglishLocale, localeText } from "../lib/locale";
import { useLocaleStore } from "../store/locale-store";
import { useSessionStore } from "../store/session-store";

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionStatus = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const setAnonymous = useSessionStore((state) => state.setAnonymous);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isEnglish = isEnglishLocale(locale);

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
      return [{ label: isEnglish ? "Sign In" : "登录入口", to: "/login" }];
    }

    const baseItems = [
      { label: localeText(locale, "学生首页", "Student Home"), to: "/" },
      { label: localeText(locale, "体育空间", "Sports"), to: "/sports" },
      { label: localeText(locale, "校园活动", "Activities"), to: "/activities" },
      { label: localeText(locale, "学术空间", "Study Spaces"), to: "/spaces" }
    ];

    baseItems.push({ label: localeText(locale, "历史记录", "History"), to: "/orders" });

    return baseItems;
  }, [isEnglish, locale, sessionStatus, user?.role]);

  const currentSection = useMemo(() => {
    const pathname = location.pathname;

    if (pathname.startsWith("/spaces")) {
      return {
        label: localeText(locale, "学术空间", "Study Spaces"),
        title: localeText(locale, "连续时段预约", "Continuous Booking"),
        description: localeText(
          locale,
          "面向自习、研讨和协作场景的学术空间服务。",
          "Study spaces for self-study, group discussion, and academic collaboration."
        )
      };
    }

    if (pathname.startsWith("/sports")) {
      return {
        label: localeText(locale, "体育设施", "Sports Facilities"),
        title: localeText(locale, "离散槽位预约", "Slot-based Booking"),
        description: localeText(
          locale,
          "面向球场与组合场地的统一预约入口。",
          "A unified entry for courts and bundled sports venue bookings."
        )
      };
    }

    if (pathname.startsWith("/activities")) {
      return {
        label: localeText(locale, "校园活动", "Campus Activities"),
        title: localeText(locale, "报名与抢票", "Registration & Tickets"),
        description: localeText(
          locale,
          "面向讲座、社团和校园活动的统一入口。",
          "A unified entry for lectures, clubs, and campus event registration."
        )
      };
    }

    if (pathname.startsWith("/orders")) {
      return {
        label: localeText(locale, "历史记录", "History"),
        title: localeText(locale, "近期预约与报名记录", "Recent Bookings and Registrations"),
        description: localeText(
          locale,
          "回看个人订单、状态变化和最近完成的服务记录。",
          "Review your orders, status changes, and recently completed services."
        )
      };
    }

    if (pathname.startsWith("/admin")) {
      return {
        label: localeText(locale, "教师工作台", "Teacher Workspace"),
        title: localeText(locale, "工作台与服务维护", "Workspace & Service Operations"),
        description: localeText(
          locale,
          "集中查看资源、活动、规则更新和日常维护入口。",
          "Review resource, activity, and rule updates with daily maintenance shortcuts."
        )
      };
    }

    if (pathname.startsWith("/login")) {
      return {
        label: isEnglish ? "Access" : "身份入口",
        title: isEnglish ? "Unified Sign In" : "统一登录",
        description: isEnglish
          ? "Sign in to enter the student portal or the teacher workspace."
          : "登录后可进入学生服务首页或教师工作台。"
      };
    }

    if (user?.role === "admin") {
      return {
        label: localeText(locale, "教师工作台", "Teacher Workspace"),
        title: localeText(locale, "今日维护概览", "Today’s Operations Overview"),
        description: localeText(
          locale,
          "聚焦资源、活动和规则的维护任务，不再混入学生端服务入口。",
          "Focus on resource, activity, and rule maintenance instead of student-facing service entry points."
        )
      };
    }

    return sessionStatus === "authenticated"
      ? {
          label: localeText(locale, "学生首页", "Student Home"),
          title: localeText(locale, "今日常用服务", "Today’s Student Services"),
          description: localeText(
            locale,
            "从体育空间、校园活动和学术空间三个入口开始，再查看历史记录与近期通知。",
            "Start from sports, activities, and study spaces, then review your history and recent notices."
          )
        }
      : {
          label: isEnglish ? "Access" : "统一入口",
          title: isEnglish ? "Sign in to continue" : "登录后进入对应工作区",
          description: isEnglish
            ? "Guests only see the sign-in entry. Resource pages are available after authentication."
            : "访客当前只保留登录入口，资源页需要登录后才可访问。"
        };
  }, [isEnglish, locale, location.pathname, sessionStatus, user?.role]);

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
      <div className="border-b border-white/10 bg-navy text-white/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-[11px] uppercase tracking-[0.28em] sm:px-6">
          <span>HKUST(GZ) Campus Service</span>
          <span className="hidden sm:inline">
            CampusBook · Reservation & Activities
          </span>
        </div>
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:py-8">
        <header className="overflow-hidden rounded-[32px] border border-navy/10 bg-white shadow-panel">
          <div className="grid lg:grid-cols-[minmax(0,1.35fr),360px]">
            <div className="relative overflow-hidden bg-gradient-to-br from-navy via-[#0d3f82] to-moss px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-10">
              <div className="absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_65%)]" />
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.34em] text-white/60">
                  香港科技大学（广州）
                </p>
                <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-[3.4rem]">
                  CampusBook 智约校园
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
                  {sessionStatus === "authenticated"
                    ? localeText(
                        locale,
                        "面向校内学习、运动与活动场景的一体化服务门户。学生可在同一站点完成空间预约、体育设施预订与活动报名；管理员可进入统一工作台维护资源、活动和规则。",
                        "A unified service portal for learning spaces, sports bookings, and campus activities. Students complete bookings in one place, while teachers manage resources, events, and rules from a single workspace."
                      )
                    : isEnglish
                      ? "Guests only see a unified sign-in entry. After signing in, students enter the service portal and teachers enter the workspace."
                      : "访客模式下仅保留统一登录入口。登录后，学生进入服务首页，教师或管理身份进入工作台。"}
                </p>
                {sessionStatus === "authenticated" ? (
                  <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-white/78">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                      {localeText(locale, "HTTPS 已启用", "HTTPS Enabled")}
                    </span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                      {localeText(locale, "统一订单", "Unified Orders")}
                    </span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                      {localeText(locale, "角色权限", "Role Access")}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col justify-between bg-white px-6 py-6 sm:px-8">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-moss">
                  {localeText(locale, "当前模块", "Current Section")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-ink">
                  {currentSection.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate">
                  {currentSection.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-sand px-3 py-2 text-xs uppercase tracking-[0.2em] text-moss">
                    {currentSection.label}
                  </span>
                  <span className="rounded-full bg-sand px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate">
                    {user?.role === "admin"
                      ? localeText(locale, "管理端视图", "Admin View")
                      : localeText(locale, "学生端视图", "Student View")}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-navy/10 bg-sand px-5 py-5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.28em] text-moss">
                    {isEnglish && sessionStatus !== "authenticated" ? "Access" : localeText(locale, "服务状态", "Service Status")}
                  </p>
                  <div className="inline-flex rounded-full border border-navy/10 bg-white p-1">
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] transition ${
                        locale === "zh-CN" ? "bg-ember text-white" : "text-slate hover:text-ink"
                      }`}
                      onClick={() => setLocale("zh-CN")}
                    >
                      中文
                    </button>
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] transition ${
                        locale === "en" ? "bg-ember text-white" : "text-slate hover:text-ink"
                      }`}
                      onClick={() => setLocale("en")}
                    >
                      EN
                    </button>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate">
                  {sessionStatus === "authenticated"
                    ? localeText(
                        locale,
                        "当前站点已经开放学术空间、体育设施、校园活动与管理后台四类入口。",
                        "The site currently provides study spaces, sports, campus activities, and the admin workspace."
                      )
                    : isEnglish
                      ? "Guests can only access sign-in. Student and teacher functions open after authentication."
                      : "当前为访客模式，仅开放统一登录入口。学生与教师功能需登录后进入。"}
                </p>
                <div className="mt-4 border-t border-navy/10 pt-4">
                  {sessionStatus === "authenticated" && user ? (
                    <>
                      <p className="font-medium text-ink">{user.email}</p>
                      <p className="mt-1 text-slate">
                        {localeText(locale, "当前身份：", "Current role: ")}
                        {user.role === "admin"
                          ? localeText(locale, "管理员", "Teacher/Admin")
                          : localeText(locale, "普通用户", "Student")}
                      </p>
                      <button
                        type="button"
                        className="mt-4 rounded-full bg-ember px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:bg-ember/90"
                        onClick={() => void handleLogout()}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut
                          ? localeText(locale, "退出中", "Signing Out")
                          : localeText(locale, "退出登录", "Sign Out")}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-ink">
                        {isEnglish ? "Guest mode" : "当前为访客模式"}
                      </p>
                      <p className="mt-1 text-slate">
                        {isEnglish
                          ? "Use a demo account to enter the student portal or the teacher workspace."
                          : "可使用示例账号进入学生端或教师工作台。"}
                      </p>
                      <Link
                        to="/login"
                        className="mt-4 inline-flex rounded-full bg-ember px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:bg-ember/90"
                      >
                        {isEnglish ? "Go to Sign In" : "前往登录"}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {sessionStatus === "unknown" ? (
          <div className="mt-4 rounded-[24px] border border-moss/15 bg-mist px-4 py-3 text-sm text-slate">
            正在恢复你的登录状态，请稍候。
          </div>
        ) : null}

        <nav className="mt-5 rounded-[24px] border border-navy/10 bg-white/90 p-3 shadow-panel backdrop-blur">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "whitespace-nowrap rounded-full border px-4 py-2.5 text-sm transition",
                    isActive
                      ? "border-ember bg-ember text-white"
                      : "border-navy/10 bg-sand text-ink hover:border-moss hover:text-moss"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="mt-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
