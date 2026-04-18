import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { RouteCard } from "@campusbook/shared-types";

import { fetchHealthStatus } from "../../lib/api";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";

const routeCards: RouteCard[] = [
  {
    title: "学术空间预约",
    description: "连续时间段 + 前后 5 分钟缓冲，后续将接 PostgreSQL 排斥约束。",
    href: "/spaces",
    badge: "Atomic Resource"
  },
  {
    title: "体育设施预约",
    description: "按 1 小时离散槽位建模，支持单场地与组合场地预约。",
    href: "/sports",
    badge: "Slot Booking"
  },
  {
    title: "校园活动抢票",
    description: "热点库存先入 Redis，再通过 BullMQ 异步落单。",
    href: "/activities",
    badge: "High Concurrency"
  }
];

export function HomePage() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealthStatus
  });

  return (
    <>
      <PageHero
        eyebrow="Stage 01"
        title="当前已进入可持续开发的工程骨架阶段"
        description="前端已经接通真实 API、登录态恢复、预约、抢票、订单查看与最小管理入口。当前站点已经可以作为比赛演示的交互前台继续完善。"
        aside={
          <>
            <p className="font-medium text-ink">当前会话</p>
            <p className="mt-3 text-sm text-ink/80">
              {status === "authenticated" && user
                ? `${user.email} · ${user.role === "admin" ? "管理员" : "普通用户"}`
                : status === "unknown"
                  ? "正在恢复登录态"
                  : "未登录"}
            </p>
            <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-ink/75">
              <p>学生演示账号：demo@campusbook.top / demo123456</p>
              <p>管理员账号：admin@campusbook.top / admin123456</p>
            </div>
          </>
        }
      />

      <PageSection title="API 健康检查">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-ink/10 bg-sand px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/55">
              状态
            </p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {isLoading
                ? "检查中"
                : isError
                  ? "未连通"
                  : data?.status ?? "未知"}
            </p>
          </div>
          <div className="rounded-3xl border border-ink/10 bg-sand px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/55">
              PostgreSQL
            </p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {data?.dependencies.postgres ?? "unknown"}
            </p>
          </div>
          <div className="rounded-3xl border border-ink/10 bg-sand px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/55">
              Redis
            </p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {data?.dependencies.redis ?? "unknown"}
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection title="核心业务入口">
        <div className="grid gap-4 lg:grid-cols-3">
          {routeCards.map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="rounded-[24px] border border-ink/10 bg-sand px-5 py-5 transition hover:-translate-y-1 hover:border-moss"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-moss">
                {card.badge}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-ink">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/75">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </PageSection>
    </>
  );
}
