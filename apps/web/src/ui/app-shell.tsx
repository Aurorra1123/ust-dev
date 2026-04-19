import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { logout, refreshSession } from "../lib/api";
import { useSessionStore } from "../store/session-store";

export function AppShell() {
  const location = useLocation();
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

  const currentSection = useMemo(() => {
    const pathname = location.pathname;

    if (pathname.startsWith("/spaces")) {
      return {
        label: "学术空间",
        title: "连续时段预约",
        description: "面向自习、研讨和协作场景的学术空间服务。"
      };
    }

    if (pathname.startsWith("/sports")) {
      return {
        label: "体育设施",
        title: "离散槽位预约",
        description: "面向球场与组合场地的统一预约入口。"
      };
    }

    if (pathname.startsWith("/activities")) {
      return {
        label: "校园活动",
        title: "报名与抢票",
        description: "面向讲座、社团和校园活动的统一入口。"
      };
    }

    if (pathname.startsWith("/orders")) {
      return {
        label: "我的订单",
        title: "预约与报名记录",
        description: "查看个人订单、状态变化和取消结果。"
      };
    }

    if (pathname.startsWith("/admin")) {
      return {
        label: "管理后台",
        title: "运营与配置工作台",
        description: "集中维护资源、活动、票种和规则配置。"
      };
    }

    if (pathname.startsWith("/login")) {
      return {
        label: "身份入口",
        title: "统一登录",
        description: "登录后可进入学生服务或管理员工作台。"
      };
    }

    return {
      label: "服务总览",
      title: "校园预约与活动门户",
      description: "统一提供空间预约、体育设施、活动报名与管理入口。"
    };
  }, [location.pathname]);

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
                  面向校内学习、运动与活动场景的一体化服务门户。学生可在同一站点完成空间预约、
                  体育设施预订与活动报名；管理员可进入统一工作台维护资源、活动和规则。
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-white/78">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                    HTTPS 已启用
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                    统一订单
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                    角色权限
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between bg-white px-6 py-6 sm:px-8">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-moss">
                  当前模块
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
                    {user?.role === "admin" ? "管理端视图" : "学生端视图"}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-navy/10 bg-sand px-5 py-5 text-sm">
                <p className="text-xs uppercase tracking-[0.28em] text-moss">
                  服务状态
                </p>
                <p className="mt-4 text-sm leading-7 text-slate">
                  当前站点已经开放学术空间、体育设施、校园活动与管理后台四类入口。
                </p>
                <div className="mt-4 border-t border-navy/10 pt-4">
                  {sessionStatus === "authenticated" && user ? (
                    <>
                      <p className="font-medium text-ink">{user.email}</p>
                      <p className="mt-1 text-slate">
                        当前身份：{user.role === "admin" ? "管理员" : "普通用户"}
                      </p>
                      <button
                        type="button"
                        className="mt-4 rounded-full bg-ember px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:bg-ember/90"
                        onClick={() => void handleLogout()}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? "退出中" : "退出登录"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-ink">当前为访客模式</p>
                      <p className="mt-1 text-slate">
                        可使用示例账号进入学生端或管理端。
                      </p>
                      <Link
                        to="/login"
                        className="mt-4 inline-flex rounded-full bg-ember px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:bg-ember/90"
                      >
                        前往登录
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
