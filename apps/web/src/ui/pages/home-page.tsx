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
    description: "支持研讨室、自习空间与协作区域的连续时段预约。",
    href: "/spaces",
    badge: "Study & Collaboration"
  },
  {
    title: "体育设施预约",
    description: "按离散槽位提供球场与组合场地的统一预约入口。",
    href: "/sports",
    badge: "Sports Booking"
  },
  {
    title: "校园活动报名",
    description: "统一浏览校园活动并完成报名、抢票与状态追踪。",
    href: "/activities",
    badge: "Events & Tickets"
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
        eyebrow="Campus Service Portal"
        title="把高频校园服务收敛到同一个入口"
        description="CampusBook 面向香港科技大学（广州）校内的学习、运动与活动场景，提供统一的预约、报名与管理入口。学生与管理员共享同一站点，但按角色获得不同能力。"
        aside={
          <>
            <p className="font-medium text-ink">当前会话</p>
            <p className="mt-3 text-sm text-slate">
              {status === "authenticated" && user
                ? `${user.email} · ${user.role === "admin" ? "管理员" : "普通用户"}`
                : status === "unknown"
                  ? "正在恢复登录态"
                  : "未登录"}
            </p>
            <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-slate">
              <p>学生体验账号：demo@campusbook.top / demo123456</p>
              <p>管理员账号：admin@campusbook.top / admin123456</p>
            </div>
          </>
        }
      />

      <PageSection
        title="快速服务入口"
        description="面向学生的三条主路径已经全部接入真实后端能力，后续会继续补齐页面细节与浏览器级回归。"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {routeCards.map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="group rounded-[26px] border border-navy/10 bg-gradient-to-br from-white to-sand px-5 py-5 transition hover:-translate-y-1 hover:border-moss"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-moss">
                {card.badge}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-ink">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate">{card.description}</p>
              <p className="mt-5 text-sm font-medium text-ember transition group-hover:translate-x-1">
                进入服务 →
              </p>
            </Link>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="平台运行状态"
        description="当前线上站点已经完成 HTTPS 切换，并接入数据库、缓存和最小回归校验。"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatusCard
            label="状态"
            value={
              isLoading ? "检查中" : isError ? "未连通" : data?.status ?? "未知"
            }
          />
          <StatusCard
            label="PostgreSQL"
            value={data?.dependencies.postgres ?? "unknown"}
          />
          <StatusCard label="Redis" value={data?.dependencies.redis ?? "unknown"} />
        </div>
      </PageSection>

      <PageSection
        title="服务方式"
        description="当前平台的产品目标是把分散在不同入口的预约与报名行为，收敛到一套统一的账户、状态和规则体系中。"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "统一身份",
              description: "学生和管理员共享同一站点，通过角色区分可见页面和可执行动作。"
            },
            {
              title: "统一订单",
              description: "空间预约、体育设施和活动报名都进入同一订单状态机与日志体系。"
            },
            {
              title: "统一规则",
              description: "资源限制、信用分和身份约束通过规则引擎进入主流程，而不是散落在各页面。"
            }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-navy/10 bg-white px-5 py-5"
            >
              <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate">{item.description}</p>
            </div>
          ))}
        </div>
      </PageSection>
    </>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-navy/10 bg-sand px-5 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/55">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
