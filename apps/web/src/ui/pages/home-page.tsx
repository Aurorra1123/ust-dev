import { Link, Navigate } from "react-router-dom";

import { localeText } from "../../lib/locale";
import { useLocaleStore } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";
import { homeServiceCards } from "../helpers/home-service-cards";
import { buildDemoLoginPath, quickRoleEntries } from "../demo-accounts";
import { HomeNotificationsSection } from "./home-notifications-section";

export function HomePage() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  if (status === "authenticated" && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (status === "anonymous") {
    return <PublicHome />;
  }

  if (status !== "authenticated") {
    return null;
  }

  return <StudentHome />;
}

function PublicHome() {
  const locale = useLocaleStore((state) => state.locale);

  return (
    <div className="grid gap-6">
      <section className="rounded-[30px] border border-navy/10 bg-white px-6 py-6 shadow-panel lg:px-8">
        <p className="text-xs uppercase tracking-[0.28em] text-moss">
          {localeText(locale, "系统入口", "Portal")}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">
          {localeText(locale, "校园预约平台", "Campus Booking Platform")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate">
          {localeText(
            locale,
            "从主页面直接选择学生或教师入口，系统会自动带入对应 demo 账号，便于课堂演示与联调。",
            "Choose the student or teacher entry from the landing page to fill the matching demo credentials for class demos and integration."
          )}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {quickRoleEntries.map((entry) => (
            <Link
              key={entry.role}
              to={buildDemoLoginPath(
                entry.role,
                entry.role === "teacher" ? "/admin" : "/"
              )}
              className="rounded-[24px] border border-navy/10 bg-sand px-5 py-5 transition hover:border-moss"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-moss">
                {localeText(locale, "快捷登录", "Quick Access")}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">
                {localeText(locale, entry.labelZh, entry.labelEn)}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate">
                {localeText(locale, entry.hintZh, entry.hintEn)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[30px] border border-navy/10 bg-white px-6 py-6 shadow-panel lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            to={buildDemoLoginPath("student", "/sports")}
            className="rounded-[24px] bg-gradient-to-br from-navy via-[#0d3f82] to-moss px-6 py-6 text-white"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">
              {localeText(locale, "学生演示", "Student Demo")}
            </p>
            <h3 className="mt-3 text-3xl font-semibold">
              {localeText(locale, "直接体验预约", "Start Student Flow")}
            </h3>
          </Link>

          <Link
            to={buildDemoLoginPath("teacher", "/admin")}
            className="rounded-[24px] border border-navy/10 bg-sand px-6 py-6"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-moss">
              {localeText(locale, "教师工作台", "Teacher Workspace")}
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-ink">
              {localeText(locale, "进入后台管理", "Open Admin Flow")}
            </h3>
          </Link>
        </div>
      </section>

      <section className="rounded-[30px] border border-navy/10 bg-white px-6 py-6 shadow-panel lg:px-8">
        <div className="grid gap-4 lg:grid-cols-4">
          {homeServiceCards.map((card) => (
            <Link
              key={card.id}
              to={buildDemoLoginPath("student", card.href)}
              className="rounded-[24px] border border-navy/10 bg-sand px-5 py-5 transition hover:border-moss"
            >
              <h3 className="text-2xl font-semibold text-ink">
                {localeText(locale, card.titleZh, card.titleEn)}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate">
                {localeText(locale, card.descriptionZh, card.descriptionEn)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <HomeNotificationsSection
        locale={locale}
        actionTo={buildDemoLoginPath("student", "/")}
        actionLabelZh="带入学生 demo 查看首页"
        actionLabelEn="Use Student Demo"
      />
    </div>
  );
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
            to="/service-requests"
            className="rounded-[24px] border border-navy/10 bg-sand px-6 py-6"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-moss">
              {localeText(locale, "服务台", "Service Desk")}
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-ink">
              {localeText(locale, "提交报修", "Submit Request")}
            </h3>
          </Link>
        </div>
      </section>

      <section className="rounded-[30px] border border-navy/10 bg-white px-6 py-6 shadow-panel lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {homeServiceCards.map((card) => (
            <Link
              key={card.id}
              to={card.href}
              className="rounded-[24px] border border-navy/10 bg-sand px-5 py-5 transition hover:border-moss"
            >
              <h3 className="text-2xl font-semibold text-ink">
                {localeText(locale, card.titleZh, card.titleEn)}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate">
                {localeText(locale, card.descriptionZh, card.descriptionEn)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <HomeNotificationsSection
        locale={locale}
        actionTo="/orders"
        actionLabelZh="查看我的订单"
        actionLabelEn="View My Orders"
      />
    </div>
  );
}
