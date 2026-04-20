import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import type { ActivityListItem, OrderDetailResponse } from "@campusbook/shared-types";

import {
  ApiError,
  fetchActivities,
  fetchOrders,
  fetchResources
} from "../../lib/api";
import { formatDateTime } from "../../lib/date";
import { isEnglishLocale, localeText } from "../../lib/locale";
import { useLocaleStore } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import {
  EmptyPanel,
  StatePanel,
  StatusPill
} from "../user-experience-kit";

const studentServices = [
  {
    title: "体育空间",
    description: "查看球场和组合场地的可用时段，快速完成预约。",
    href: "/sports",
    badge: "Sports"
  },
  {
    title: "校园活动",
    description: "浏览近期活动，完成报名、抢票和结果查看。",
    href: "/activities",
    badge: "Activities"
  },
  {
    title: "学术空间",
    description: "预约自习室、研讨室和协作空间的连续时间段。",
    href: "/spaces",
    badge: "Study"
  }
];

export function HomePage() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  if (status === "authenticated" && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return status === "authenticated" ? <StudentHome /> : <GuestHome />;
}

function GuestHome() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const isEnglish = isEnglishLocale(locale);

  return (
    <>
      <PageHero
        eyebrow={isEnglish ? "Unified Access" : "统一入口"}
        title={
          isEnglish
            ? "Sign in to enter the right workspace"
            : "登录后进入对应的校园服务首页"
        }
        description={
          isEnglish
            ? "Guests only see a simple sign-in entry here. Students enter the campus services portal after login, while teachers enter the workspace."
            : "访客首页只保留最直接的登录入口。学生登录后进入校园服务首页，教师或管理身份登录后进入工作台。"
        }
        aside={
          <>
            <p className="font-medium text-ink">
              {isEnglish ? "Language" : "语言选择"}
            </p>
            <div className="mt-4 inline-flex rounded-full border border-navy/10 bg-sand p-1">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition ${
                  locale === "zh-CN"
                    ? "bg-ember text-white"
                    : "text-slate hover:text-ink"
                }`}
                onClick={() => setLocale("zh-CN")}
              >
                中文
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition ${
                  locale === "en"
                    ? "bg-ember text-white"
                    : "text-slate hover:text-ink"
                }`}
                onClick={() => setLocale("en")}
              >
                English
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <Link
                to="/login"
                className="rounded-2xl bg-ember px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-ember/90"
              >
                {isEnglish ? "Go to Sign In" : "进入统一登录"}
              </Link>
              <div className="rounded-2xl border border-navy/10 bg-white px-4 py-4 text-xs leading-6 text-slate">
                <p>
                  {isEnglish
                    ? "Student: demo@campusbook.top / demo123456"
                    : "学生入口：demo@campusbook.top / demo123456"}
                </p>
                <p>
                  {isEnglish
                    ? "Teacher: admin@campusbook.top / admin123456"
                    : "教师入口：admin@campusbook.top / admin123456"}
                </p>
              </div>
            </div>
          </>
        }
      />
    </>
  );
}

function StudentHome() {
  const user = useSessionStore((state) => state.user);
  const locale = useLocaleStore((state) => state.locale);
  const isEnglish = isEnglishLocale(locale);
  const sportsQuery = useQuery({
    queryKey: ["resources", "sports_facility", "student-home"],
    queryFn: () => fetchResources("sports_facility")
  });
  const academicQuery = useQuery({
    queryKey: ["resources", "academic_space", "student-home"],
    queryFn: () => fetchResources("academic_space")
  });
  const activitiesQuery = useQuery({
    queryKey: ["activities", "student-home"],
    queryFn: fetchActivities
  });
  const ordersQuery = useQuery({
    queryKey: ["orders", "student-home"],
    queryFn: fetchOrders
  });

  const recentActivities =
    activitiesQuery.data
      ?.filter((activity) => activity.status === "published")
      .slice(0, 3) ?? [];
  const recentOrders = ordersQuery.data?.slice(0, 4) ?? [];

  return (
    <>
      <PageHero
        eyebrow={localeText(locale, "学生服务", "Student Services")}
        title={
          isEnglish
            ? `Welcome back, ${user?.email ?? "Student"}`
            : `欢迎回来，${user?.email ?? "同学"}`
        }
        description={localeText(
          locale,
          "这里就是学生登录后的真实首页。你最常用的三类校园服务会直接放在第一屏，历史记录和近期活动通知也集中放在同一页。",
          "This is the real student homepage after login. Your three most-used campus services stay in the first view, while history and recent activity notices are grouped below."
        )}
        aside={
          <>
            <p className="font-medium text-ink">{localeText(locale, "今日入口", "Today’s Entries")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill tone="brand">{localeText(locale, "体育空间", "Sports")}</StatusPill>
              <StatusPill tone="brand">{localeText(locale, "校园活动", "Activities")}</StatusPill>
              <StatusPill tone="brand">{localeText(locale, "学术空间", "Study Spaces")}</StatusPill>
            </div>
            <div className="mt-4 rounded-2xl bg-white px-4 py-4 text-sm text-slate">
              <p>{localeText(locale, "最近记录：", "Recent records: ")}{ordersQuery.data?.length ?? 0}{localeText(locale, " 条", "",)}</p>
              <p className="mt-1">{localeText(locale, "近期通知：", "Recent notices: ")}{recentActivities.length}{localeText(locale, " 条", "",)}</p>
            </div>
          </>
        }
      />

      <PageSection
        title={localeText(locale, "常用服务", "Common Services")}
        description={localeText(
          locale,
          "学生首页只保留三类最常用的服务入口，不再把所有功能和说明堆在第一屏。",
          "The student homepage only keeps the three most common service entries instead of stacking everything into the first screen."
        )}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {studentServices.map((service) => (
            <StudentServiceCard
              key={service.href}
              title={localeText(locale, service.title, service.badge === "Sports" ? "Sports" : service.badge === "Activities" ? "Activities" : "Study Spaces")}
              description={localeText(
                locale,
                service.description,
                service.badge === "Sports"
                  ? "Check available court slots and complete a booking quickly."
                  : service.badge === "Activities"
                    ? "Browse recent events and complete registration or ticket requests."
                    : "Book continuous time slots for study rooms, discussion rooms, and collaboration spaces."
              )}
              href={service.href}
              badge={service.badge}
              stat={
                service.href === "/sports"
                  ? isEnglish
                    ? `${sportsQuery.data?.length ?? 0} resource types`
                    : `${sportsQuery.data?.length ?? 0} 类资源`
                  : service.href === "/activities"
                    ? isEnglish
                      ? `${activitiesQuery.data?.length ?? 0} events`
                      : `${activitiesQuery.data?.length ?? 0} 场活动`
                    : isEnglish
                      ? `${academicQuery.data?.length ?? 0} resource types`
                      : `${academicQuery.data?.length ?? 0} 类资源`
              }
              enterLabel={localeText(locale, "进入", "Open")}
            />
          ))}
        </div>
      </PageSection>

      <PageSection
        title={localeText(locale, "历史记录", "History")}
        description={localeText(
          locale,
          "最近的预约、报名和状态变化会出现在这里，方便你快速回看。",
          "Your recent bookings, registrations, and status changes appear here for quick review."
        )}
        action={
          <Link
            to="/orders"
            className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
          >
            {localeText(locale, "查看全部记录", "View All")}
          </Link>
        }
      >
        {ordersQuery.isLoading ? (
          <StatePanel
            tone="loading"
            title={localeText(locale, "正在载入历史记录", "Loading History")}
            description={localeText(locale, "页面正在整理你最近的预约与活动报名结果。", "Preparing your recent bookings and activity registrations.")}
          />
        ) : ordersQuery.isError ? (
          <StatePanel
            tone="danger"
            title={localeText(locale, "历史记录暂时无法读取", "History Unavailable")}
            description={(ordersQuery.error as ApiError).message}
          />
        ) : !recentOrders.length ? (
          <EmptyPanel
            title={localeText(locale, "你还没有最近记录", "No recent records yet")}
            description={localeText(locale, "完成一次预约或活动报名后，最近记录会立即显示在这里。", "Once you complete a booking or activity registration, it will appear here immediately.")}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {recentOrders.map((order) => (
              <HistoryCard key={order.id} order={order} locale={locale} />
            ))}
          </div>
        )}
      </PageSection>

      <PageSection
        title={localeText(locale, "近期活动通知栏", "Recent Activity Notices")}
        description={localeText(
          locale,
          "这里展示近期值得关注的活动，方便你从首页直接进入活动页。",
          "Recent events worth attention are listed here so that you can jump into the activities page directly."
        )}
      >
        {activitiesQuery.isLoading ? (
          <StatePanel
            tone="loading"
            title={localeText(locale, "正在载入近期活动", "Loading Recent Activities")}
            description={localeText(locale, "页面正在准备最近可关注的活动通知。", "Preparing recent activity notices for you.")}
          />
        ) : activitiesQuery.isError ? (
          <StatePanel
            tone="danger"
            title={localeText(locale, "近期活动暂时无法读取", "Recent Activities Unavailable")}
            description={(activitiesQuery.error as ApiError).message}
          />
        ) : !recentActivities.length ? (
          <EmptyPanel
            title={localeText(locale, "近期没有新的活动通知", "No new activity notices")}
            description={localeText(locale, "稍后刷新页面，或直接进入校园活动页查看全部内容。", "Refresh later or visit the activities page to see the full list.")}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {recentActivities.map((activity) => (
              <NoticeCard key={activity.id} activity={activity} locale={locale} />
            ))}
          </div>
        )}
      </PageSection>
    </>
  );
}

function StudentServiceCard({
  title,
  description,
  href,
  badge,
  stat,
  enterLabel
}: {
  title: string;
  description: string;
  href: string;
  badge: string;
  stat: string;
  enterLabel: string;
}) {
  return (
    <Link
      to={href}
      className="group rounded-[28px] border border-navy/10 bg-gradient-to-br from-white via-white to-sand px-6 py-6 transition hover:-translate-y-1 hover:border-moss hover:shadow-panel"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{badge}</p>
      <h3 className="mt-3 text-2xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate">{description}</p>
      <div className="mt-6 flex items-center justify-between">
        <span className="rounded-full bg-sand px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate">
          {stat}
        </span>
        <span className="text-sm font-medium text-ember transition group-hover:translate-x-1">
          {enterLabel} →
        </span>
      </div>
    </Link>
  );
}

function HistoryCard({ order, locale }: { order: OrderDetailResponse; locale: "zh-CN" | "en" }) {
  return (
    <div className="rounded-[26px] border border-navy/10 bg-white px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-moss">
            {order.bizType === "activity_registration"
              ? localeText(locale, "校园活动", "Activity")
              : localeText(locale, "资源服务", "Resource Service")}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-ink">{order.orderNo}</h3>
        </div>
        <StatusPill
          tone={
            order.status === "confirmed"
              ? "success"
              : order.status === "cancelled"
                ? "danger"
                : "brand"
          }
        >
          {orderStatusLabel(order.status, locale)}
        </StatusPill>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate">{describeOrder(order, locale)}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink/45">
        {formatDateTime(order.createdAt)}
      </p>
    </div>
  );
}

function NoticeCard({ activity, locale }: { activity: ActivityListItem; locale: "zh-CN" | "en" }) {
  return (
    <Link
      to="/activities"
      className="rounded-[26px] border border-navy/10 bg-gradient-to-br from-white to-sand px-5 py-5 transition hover:-translate-y-1 hover:border-moss"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-moss">
        {localeText(locale, "校园通知", "Campus Notice")}
      </p>
      <h3 className="mt-3 text-lg font-semibold text-ink">{activity.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate">
        {activity.location || localeText(locale, "活动地点待补充", "Location pending")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill tone="brand">{activityStatusLabel(activity.status, locale)}</StatusPill>
        <StatusPill tone="success">
          {localeText(locale, `剩余 ${activity.remainingQuota}`, `${activity.remainingQuota} left`)}
        </StatusPill>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-ink/45">
        {formatDateTime(activity.saleStartTime)}
      </p>
    </Link>
  );
}

function describeOrder(order: OrderDetailResponse, locale: "zh-CN" | "en") {
  if (order.academicReservation) {
    return `${order.academicReservation.resourceUnitName} · ${formatDateTime(order.academicReservation.startTime)}`;
  }

  if (order.sportsReservationSlots.length) {
    const firstSlot = order.sportsReservationSlots[0];
    return firstSlot
      ? `${firstSlot.resourceName} · ${order.sportsReservationSlots.length}${localeText(locale, " 个槽位", " slots")}`
      : localeText(locale, "体育空间预约", "Sports booking");
  }

  if (order.activityRegistration) {
    return `${order.activityRegistration.activityTitle} · ${order.activityRegistration.activityTicketName}`;
  }

  return localeText(locale, "近期服务记录", "Recent service record");
}

function orderStatusLabel(status: OrderDetailResponse["status"], locale: "zh-CN" | "en") {
  switch (status) {
    case "pending_confirmation":
      return localeText(locale, "待确认", "Pending");
    case "confirmed":
      return localeText(locale, "已确认", "Confirmed");
    case "cancelled":
      return localeText(locale, "已取消", "Cancelled");
    case "no_show":
      return localeText(locale, "已爽约", "No-show");
  }
}

function activityStatusLabel(status: ActivityListItem["status"], locale: "zh-CN" | "en") {
  switch (status) {
    case "draft":
      return localeText(locale, "草稿", "Draft");
    case "published":
      return localeText(locale, "已发布", "Published");
    case "closed":
      return localeText(locale, "已关闭", "Closed");
    case "cancelled":
      return localeText(locale, "已取消", "Cancelled");
  }
}
