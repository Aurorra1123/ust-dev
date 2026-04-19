import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { RouteCard } from "@campusbook/shared-types";

import { fetchActivities, fetchHealthStatus, fetchResources } from "../../lib/api";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import {
  HighlightPanel,
  MetricCard,
  MetricGrid,
  StepList
} from "../user-experience-kit";

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
  const academicResourcesQuery = useQuery({
    queryKey: ["resources", "academic_space", "home"],
    queryFn: () => fetchResources("academic_space")
  });
  const sportsResourcesQuery = useQuery({
    queryKey: ["resources", "sports_facility", "home"],
    queryFn: () => fetchResources("sports_facility")
  });
  const activitiesQuery = useQuery({
    queryKey: ["activities", "home"],
    queryFn: fetchActivities
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
            <div className="mt-4 grid gap-2">
              <span className="rounded-full bg-white px-3 py-2 text-xs uppercase tracking-[0.18em] text-moss">
                {status === "authenticated" ? "已进入服务门户" : "欢迎访问"}
              </span>
              <span className="rounded-full bg-white px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate">
                {user?.role === "admin" ? "管理端工作台" : "学生服务入口"}
              </span>
            </div>
            <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-slate">
              <p>学生入口：demo@campusbook.top / demo123456</p>
              <p>管理入口：admin@campusbook.top / admin123456</p>
            </div>
          </>
        }
      />

      <PageSection
        title="今日服务总览"
        description="首页把当天最常用的服务入口、资源规模和平台状态集中放在同一个总览面板里，方便第一次进入时快速找到主路径。"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr),380px]">
          <HighlightPanel
            eyebrow="Unified Experience"
            title="一套账号，一处入口，完成校内预约与报名"
            description="学术空间、体育设施和校园活动共用统一身份、统一订单和统一规则。学生只需要记住一个入口，管理员也可以在同一站点进入工作台。"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickBadge
                label="学术空间"
                value={String(academicResourcesQuery.data?.length ?? 0)}
                detail="类资源"
              />
              <QuickBadge
                label="体育设施"
                value={String(sportsResourcesQuery.data?.length ?? 0)}
                detail="类资源"
              />
              <QuickBadge
                label="公开活动"
                value={String(activitiesQuery.data?.length ?? 0)}
                detail="场进行中"
              />
            </div>
          </HighlightPanel>

          <div className="grid gap-4">
            <div className="rounded-[26px] border border-navy/10 bg-gradient-to-br from-white to-sand px-5 py-5">
              <p className="text-xs uppercase tracking-[0.24em] text-moss">当前状态</p>
              <div className="mt-4 grid gap-3">
                <StatusCard
                  label="平台健康"
                  value={
                    isLoading ? "检查中" : isError ? "未连通" : data?.status ?? "未知"
                  }
                />
                <StatusCard
                  label="数据可用性"
                  value={data?.dependencies.postgres ?? "unknown"}
                />
                <StatusCard
                  label="服务支撑"
                  value={data?.dependencies.redis ?? "unknown"}
                />
              </div>
            </div>
            <div className="rounded-[26px] border border-navy/10 bg-white px-5 py-5">
              <p className="text-xs uppercase tracking-[0.24em] text-moss">访问方式</p>
              <p className="mt-3 text-sm leading-7 text-slate">
                {status === "authenticated"
                  ? "你已经可以直接进入预约、抢票与订单页面。后续如需维护资源与规则，可切换到管理员账号。"
                  : "先用示例账号登录，再进入学术空间、体育设施、活动或管理后台。"}
              </p>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection
        title="快速服务入口"
        description="这里保留三条最常用的学生路径，并把入口解释、使用场景和进入动作放到同一层级。"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {routeCards.map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="group rounded-[28px] border border-navy/10 bg-gradient-to-br from-white via-white to-sand px-6 py-6 transition hover:-translate-y-1 hover:border-moss hover:shadow-panel"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-moss">
                {card.badge}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate">{card.description}</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="rounded-full bg-sand px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate">
                  {card.href === "/spaces"
                    ? "连续时间"
                    : card.href === "/sports"
                      ? "离散槽位"
                      : "报名与抢票"}
                </span>
                <span className="text-sm font-medium text-ember transition group-hover:translate-x-1">
                  进入服务 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="如何开始使用"
        description="把访问动作、提交动作和回看动作拆成三步，尽量让第一次进入的用户也能快速理解站点结构。"
      >
        <StepList
          items={[
            {
              title: "登录并选择服务",
              description:
                "先进入统一身份入口，确认自己是学生端还是管理员端，再从首页进入学术空间、体育设施或校园活动。"
            },
            {
              title: "提交预约或报名",
              description:
                "在业务页中选择资源、时间或票种。系统会自动处理冲突校验、资格校验和订单创建。"
            },
            {
              title: "在我的订单中回看状态",
              description:
                "所有动作都会进入统一订单中心。你可以持续查看待确认、已确认、取消和日志变化。"
            }
          ]}
        />
      </PageSection>

      <PageSection
        title="统一服务方式"
        description="这套站点的产品核心不是把功能堆在一起，而是把分散的预约与报名动作收敛成同一套账户、订单和规则体系。"
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
              description: "资源限制、信用分和身份约束会在服务主流程中统一执行，减少页面间规则不一致。"
            }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[26px] border border-navy/10 bg-gradient-to-br from-white to-sand px-5 py-5"
            >
              <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate">{item.description}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="关键规模"
        description="这些数字反映的是当前平台已经开放给站点访客浏览和使用的服务规模。"
      >
        <MetricGrid>
          <MetricCard
            label="学术资源"
            value={String(academicResourcesQuery.data?.length ?? 0)}
            detail="支持连续时段预约的空间资源"
          />
          <MetricCard
            label="体育资源"
            value={String(sportsResourcesQuery.data?.length ?? 0)}
            detail="支持单场地与组合场地的设施资源"
          />
          <MetricCard
            label="活动数量"
            value={String(activitiesQuery.data?.length ?? 0)}
            detail="已可浏览并支持报名的活动条目"
          />
          <MetricCard
            label="访问方式"
            value={status === "authenticated" ? "已登录" : "访客"}
            detail="登录后可进入完整操作路径"
          />
        </MetricGrid>
      </PageSection>
    </>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-navy/10 bg-sand px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/55">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function QuickBadge({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.2em] text-white/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/65">{detail}</p>
    </div>
  );
}
