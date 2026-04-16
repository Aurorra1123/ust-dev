import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";

const flow = [
  "Redis Lua 预扣库存与资格判重",
  "BullMQ 投递幂等 jobId",
  "Worker 基于唯一约束建单",
  "失败后回补库存并记录异常任务"
];

export function ActivitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Activity Grab"
        title="活动抢票链路会以防超发为最高优先级"
        description="单机阶段只强化热点路径。活动抢票先承接到 Redis，再异步落到 PostgreSQL，确保高并发下也能守住库存边界。"
      />
      <PageSection title="链路步骤">
        <ol className="grid gap-3 text-sm text-ink/80">
          {flow.map((item, index) => (
            <li key={item} className="rounded-2xl bg-sand px-4 py-3">
              {index + 1}. {item}
            </li>
          ))}
        </ol>
      </PageSection>
    </>
  );
}
