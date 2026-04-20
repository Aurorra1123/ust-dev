import { Link, Navigate } from "react-router-dom";

import { localeText } from "../../lib/locale";
import { useLocaleStore } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";

const serviceCards = [
  {
    title: "体育",
    description: "进入体育场馆预约页面，查看时段并提交预约。",
    href: "/sports"
  },
  {
    title: "学术",
    description: "进入学术空间预约页面，选择资源与时间。",
    href: "/spaces"
  },
  {
    title: "活动",
    description: "进入活动页面，查看活动并完成报名。",
    href: "/activities"
  }
] as const;

export function HomePage() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  if (status === "authenticated" && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }

  if (status !== "authenticated") {
    return null;
  }

  return <StudentHome />;
}

function StudentHome() {
  const locale = useLocaleStore((state) => state.locale);

  return (
    <div className="grid gap-6">
      <section className="rounded-[30px] border border-navy/10 bg-white px-6 py-6 shadow-panel lg:px-8">
        <p className="text-xs uppercase tracking-[0.28em] text-moss">
          {localeText(locale, "展示区", "Banner")}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">
          {localeText(locale, "校园预约平台", "Campus Booking Platform")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate">
          {localeText(
            locale,
            "从首页选择体育、学术或活动资源，进入对应页面完成预约，并在个人订单中查看状态。",
            "Choose sports, study, or activity resources from the homepage, complete the booking, and review status in your orders."
          )}
        </p>
      </section>

      <section className="rounded-[30px] border border-navy/10 bg-white px-6 py-6 shadow-panel lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            to="/sports"
            className="rounded-[24px] bg-gradient-to-br from-navy via-[#0d3f82] to-moss px-6 py-6 text-white"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">
              {localeText(locale, "主操作", "Action")}
            </p>
            <h3 className="mt-3 text-3xl font-semibold">
              {localeText(locale, "去预约", "Start Booking")}
            </h3>
          </Link>

          <Link
            to="/orders"
            className="rounded-[24px] border border-navy/10 bg-sand px-6 py-6"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-moss">
              {localeText(locale, "个人中心", "My Orders")}
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-ink">
              {localeText(locale, "我的订单", "My Orders")}
            </h3>
          </Link>
        </div>
      </section>

      <section className="rounded-[30px] border border-navy/10 bg-white px-6 py-6 shadow-panel lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {serviceCards.map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="rounded-[24px] border border-navy/10 bg-sand px-5 py-5 transition hover:border-moss"
            >
              <h3 className="text-2xl font-semibold text-ink">
                {localeText(
                  locale,
                  card.title,
                  card.title === "体育"
                    ? "Sports"
                    : card.title === "学术"
                      ? "Study"
                      : "Activities"
                )}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate">
                {localeText(
                  locale,
                  card.description,
                  card.title === "体育"
                    ? "Open the sports booking page."
                    : card.title === "学术"
                      ? "Open the study-space booking page."
                      : "Open the activity registration page."
                )}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
