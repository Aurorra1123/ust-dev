import { NavLink, Outlet } from "react-router-dom";

const navigationItems = [
  { label: "总览", to: "/" },
  { label: "学术空间", to: "/spaces" },
  { label: "体育设施", to: "/sports" },
  { label: "校园活动", to: "/activities" },
  { label: "管理后台", to: "/admin" }
];

export function AppShell() {
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
                校园预约与活动平台基础骨架
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                当前界面用于承载 React 前端骨架、核心业务导航与 API
                健康检查。后续业务页面将在此基础上逐步填充。
              </p>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-white/90 backdrop-blur">
              <p>前端入口：campusbook.top / www.campusbook.top</p>
              <p className="mt-1">后端入口：api.campusbook.top</p>
            </div>
          </div>
        </header>

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
