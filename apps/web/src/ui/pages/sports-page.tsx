import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";

const slotRules = [
  "按 1 小时离散槽位开放",
  "统一抽象为 resource_unit",
  "组合预约在同一事务内写入全部槽位",
  "任一槽位冲突则整单回滚"
];

export function SportsPage() {
  return (
    <>
      <PageHero
        eyebrow="Sports Booking"
        title="体育设施会采用槽位占用表建模"
        description="首版将用槽位唯一约束处理单场地和组合场地冲突。这样可以让业务规则直接落成数据库可执行的完整性约束。"
      />
      <PageSection title="建模方向">
        <ul className="grid gap-3 text-sm text-ink/80">
          {slotRules.map((rule) => (
            <li key={rule} className="rounded-2xl bg-sand px-4 py-3">
              {rule}
            </li>
          ))}
        </ul>
      </PageSection>
    </>
  );
}
