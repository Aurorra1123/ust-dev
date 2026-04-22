import { localeText } from "../lib/locale";
import { useLocaleStore } from "../store/locale-store";
import { StatePanel } from "./user-experience-kit";

export function RouteLoadingState() {
  const locale = useLocaleStore((state) => state.locale);

  return (
    <StatePanel
      tone="loading"
      title={localeText(locale, "页面加载中", "Loading page")}
      description={localeText(
        locale,
        "正在准备当前页面内容，请稍候。",
        "Preparing the current page content. Please wait."
      )}
    />
  );
}
