import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";

const adminModules = [
  "资源维护",
  "活动配置",
  "规则绑定",
  "订单与报名数据",
  "异常日志与补偿任务"
];

export function AdminPage() {
  return (
    <>
      <PageHero
        eyebrow="Admin Console"
        title="管理端骨架已预留到统一前端应用中"
        description="当前先采用同一 React 应用承载前台与管理端，后续根据复杂度再决定是否独立拆分管理端子应用。"
      />
      <PageSection title="首版后台模块">
        <div className="grid gap-3 sm:grid-cols-2">
          {adminModules.map((module) => (
            <div
              key={module}
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-4 text-sm text-ink/80"
            >
              {module}
            </div>
          ))}
        </div>
      </PageSection>
    </>
  );
}
