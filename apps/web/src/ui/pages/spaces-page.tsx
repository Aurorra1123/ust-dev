import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";

const checklist = [
  "连续时间段预约",
  "展示时间与实际占用时间分离",
  "预约前后自动加入 5 分钟缓冲",
  "数据库排斥约束兜底防重叠"
];

export function SpacesPage() {
  return (
    <>
      <PageHero
        eyebrow="Academic Spaces"
        title="学术空间预约将优先完成一致性建模"
        description="这一块将围绕原子资源、展示时间段与实际占用区间展开。后端会在写入时扩展 5 分钟缓冲，并通过 PostgreSQL 排斥约束防止并发重叠。"
      />
      <PageSection title="实现清单">
        <ul className="grid gap-3 text-sm text-ink/80">
          {checklist.map((item) => (
            <li key={item} className="rounded-2xl bg-sand px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </PageSection>
    </>
  );
}
