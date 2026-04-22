import type { Locale } from "../../../../store/locale-store";
import { ResourcesWorkspace } from "./resources-workspace";

export function AcademicSpacesWorkspace({ locale }: { locale: Locale }) {
  return <ResourcesWorkspace locale={locale} domain="academic" />;
}
