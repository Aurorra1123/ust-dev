import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { ApiError, fetchActivities, fetchOrders, fetchResources } from "../../lib/api";
import { formatDateTime } from "../../lib/date";
import { isEnglishLocale, localeText } from "../../lib/locale";
import { useLocaleStore } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../user-experience-kit";
import {
  orderProgressLabel,
  orderProgressTone,
  orderResourceLabel
} from "./order-utils";

const serviceCards = [
  {
    title: "体育",
    description: "查看球场和场馆时段，按时间格选择并提交预约。",
    href: "/sports",
    statsKey: "sports"
  },
  {
    title: "学术",
    description: "预约自习室、研讨室和协作空间的连续时间段。",
    href: "/spaces",
    statsKey: "academic"
  },
  {
    title: "活动",
    description: "浏览校园活动、查看票种并完成报名或抢票。",
    href: "/activities",
    statsKey: "activities"
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
  const user = useSessionStore((state) => state.user);
  const locale = useLocaleStore((state) => state.locale);
  const isEnglish = isEnglishLocale(locale);

  const sportsQuery = useQuery({
    queryKey: ["resources", "sports_facility", "home"],
    queryFn: () => fetchResources("sports_facility")
  });
  const academicQuery = useQuery({
    queryKey: ["resources", "academic_space", "home"],
    queryFn: () => fetchResources("academic_space")
  });
  const activitiesQuery = useQuery({
    queryKey: ["activities", "home"],
    queryFn: fetchActivities
  });
  const ordersQuery = useQuery({
    queryKey: ["orders", "home"],
    queryFn: fetchOrders
  });

  const publishedActivities =
    activitiesQuery.data?.filter((activity) => activity.status === "published") ?? [];
  const recentOrders =
    [...(ordersQuery.data ?? [])]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )
      .slice(0, 4) ?? [];

  const announcements = [
    {
      title: localeText(locale, "热门体育资源", "Popular Sports"),
      description: localeText(
        locale,
        `当前开放 ${sportsQuery.data?.length ?? 0} 类体育资源，支持按时段查看占用情况后直接预约。`,
        `${sportsQuery.data?.length ?? 0} sports resource types are open for slot-based booking.`
      )
    },
    {
      title: localeText(locale, "近期活动提醒", "Recent Activities"),
      description: localeText(
        locale,
        `近期共有 ${publishedActivities.length} 场已发布活动，可直接前往报名与抢票页面。`,
        `${publishedActivities.length} published activities are available for registration and ticket requests.`
      )
    },
    {
      title: localeText(locale, "学习空间开放中", "Study Spaces"),
      description: localeText(
        locale,
        `当前可浏览 ${academicQuery.data?.length ?? 0} 类学术空间，适合自习、研讨和协作预约。`,
        `${academicQuery.data?.length ?? 0} study-space types are available for booking.`
      )
    }
  ];

  return (
    <>
      <PageHero
        eyebrow={localeText(locale, "学生首页", "Student Portal")}
        title={
          isEnglish
            ? `Welcome back, ${user?.email ?? "Student"}`
            : `欢迎回来，${user?.email ?? "同学"}`
        }
        description={localeText(
          locale,
          "首页按照草图重构为“展示区 + 主操作 + 三类服务入口”的门户结构。你可以先看公告和热门资源，再从体育、学术、活动中选择一条主路径进入预约。",
          "The homepage now follows the portal prototype: a featured banner, two primary actions, and three core service entries."
        )}
        aside={
          <>
            <p className="font-medium text-ink">
              {localeText(locale, "今日状态", "Today")}
            </p>
            <div className="mt-4 grid gap-3">
              <MetricCard
                label={localeText(locale, "我的订单", "My Orders")}
                value={String(ordersQuery.data?.length ?? 0)}
              />
              <MetricCard
                label={localeText(locale, "可预约资源", "Bookable Resources")}
                value={String((sportsQuery.data?.length ?? 0) + (academicQuery.data?.length ?? 0))}
              />
              <MetricCard
                label={localeText(locale, "近期活动", "Activities")}
                value={String(publishedActivities.length)}
              />
            </div>
          </>
        }
      />

      <PageSection
        title={localeText(locale, "展示区", "Highlights")}
        description={localeText(
          locale,
          "这里承接首页顶部的轮播图、公告区或热门资源区，先把今天最值得关注的内容放出来。",
          "This block plays the role of the homepage banner, announcement zone, and featured resources area."
        )}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {announcements.map((item, index) => (
            <div
              key={item.title}
              className={`rounded-[28px] border px-5 py-5 ${
                index === 0
                  ? "border-ember/20 bg-gradient-to-br from-white via-white to-[#fff4e3]"
                  : index === 1
                    ? "border-moss/20 bg-gradient-to-br from-white via-white to-mist"
                    : "border-navy/10 bg-gradient-to-br from-white via-white to-sand"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.24em] text-moss">
                {localeText(locale, "首页看板", "Banner")}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate">{item.description}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection
        title={localeText(locale, "主操作", "Primary Actions")}
        description={localeText(
          locale,
          "展示区下方保留两个最直接的动作入口：去预约，以及进入个人订单和状态管理。",
          "Two primary actions sit right below the showcase area: start booking and open personal records."
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            to="/sports"
            className="rounded-[28px] bg-gradient-to-br from-navy via-[#0d3f82] to-moss px-6 py-6 text-white transition hover:shadow-panel"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">
              {localeText(locale, "快速开始", "Quick Start")}
            </p>
            <h3 className="mt-3 text-3xl font-semibold">
              {localeText(locale, "去预约", "Start Booking")}
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/82">
              {localeText(
                locale,
                "直接进入预约工作区，优先查看体育场馆时段，并继续切换到学术空间或校园活动。",
                "Jump into the booking workspace and start from sports, then switch to study spaces or activities."
              )}
            </p>
          </Link>

          <Link
            to="/orders"
            className="rounded-[28px] border border-navy/10 bg-white px-6 py-6 transition hover:border-moss hover:shadow-panel"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-moss">
              {localeText(locale, "个人中心", "My Records")}
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-ink">
              {localeText(locale, "我的订单", "My Orders")}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate">
              {localeText(
                locale,
                "进入个人订单与状态管理页面，查看进行中、已结束和已取消的预约。",
                "Open your orders and status pages to review ongoing, completed, and cancelled reservations."
              )}
            </p>
          </Link>
        </div>
      </PageSection>

      <PageSection
        title={localeText(locale, "核心入口", "Core Services")}
        description={localeText(
          locale,
          "首页主功能区固定为体育、学术、活动三个入口，作为学生最常用的三条业务路径。",
          "The main service zone keeps three stable entries: sports, study spaces, and activities."
        )}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {serviceCards.map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="rounded-[28px] border border-navy/10 bg-white px-5 py-5 transition hover:border-moss hover:shadow-panel"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-moss">
                {localeText(locale, "服务入口", "Service")}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">
                {localeText(
                  locale,
                  card.title,
                  card.title === "体育"
                    ? "Sports"
                    : card.title === "学术"
                      ? "Study Spaces"
                      : "Activities"
                )}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate">
                {localeText(
                  locale,
                  card.description,
                  card.statsKey === "sports"
                    ? "Open slot-based sports booking and check venue occupancy."
                    : card.statsKey === "academic"
                      ? "Book continuous slots for study and discussion rooms."
                      : "Browse campus events and complete registrations."
                )}
              </p>
              <p className="mt-4 text-sm font-medium text-ink">
                {card.statsKey === "sports"
                  ? localeText(
                      locale,
                      `${sportsQuery.data?.length ?? 0} 类体育资源`,
                      `${sportsQuery.data?.length ?? 0} sports resource types`
                    )
                  : card.statsKey === "academic"
                    ? localeText(
                        locale,
                        `${academicQuery.data?.length ?? 0} 类学术空间`,
                        `${academicQuery.data?.length ?? 0} study-space types`
                      )
                    : localeText(
                        locale,
                        `${publishedActivities.length} 场近期活动`,
                        `${publishedActivities.length} published activities`
                      )}
              </p>
            </Link>
          ))}
        </div>
      </PageSection>

      <PageSection
        title={localeText(locale, "最近订单", "Recent Orders")}
        description={localeText(
          locale,
          "首页会回显最近几条预约状态，帮助你从首页直接判断哪些订单正在进行、哪些已经取消。",
          "The homepage also surfaces your latest records so you can see which orders are active or cancelled at a glance."
        )}
        action={
          <Link
            to="/orders"
            className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
          >
            {localeText(locale, "查看全部订单", "View All")}
          </Link>
        }
      >
        {ordersQuery.isLoading ? (
          <StatePanel
            tone="loading"
            title={localeText(locale, "正在载入最近订单", "Loading Orders")}
            description={localeText(locale, "页面正在读取你的预约记录。", "Preparing your recent booking records.")}
          />
        ) : ordersQuery.isError ? (
          <StatePanel
            tone="danger"
            title={localeText(locale, "最近订单暂时无法读取", "Orders Unavailable")}
            description={(ordersQuery.error as ApiError).message}
          />
        ) : !recentOrders.length ? (
          <EmptyPanel
            title={localeText(locale, "还没有最近订单", "No Recent Orders")}
            description={localeText(locale, "完成预约后，最近状态会回显在这里。", "Recent status cards will appear here after you create bookings.")}
          />
        ) : (
          <div className="grid gap-4">
            {recentOrders.map((order) => {
              const progress = orderProgressLabel(order);

              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="rounded-[24px] border border-ink/10 bg-white px-5 py-5 transition hover:border-moss"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-moss">
                        {formatDateTime(order.createdAt)}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-ink">
                        {orderResourceLabel(order)}
                      </h3>
                    </div>
                    <StatusPill tone={orderProgressTone(progress)}>{progress}</StatusPill>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </PageSection>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
