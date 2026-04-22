import type { ReactNode } from "react";

import { EmptyPanel, StatePanel } from "../user-experience-kit";
import { localeText } from "../../lib/locale";
import { getErrorMessage } from "../../lib/http/errors";

export function OrderDetailStateView({
  locale,
  orderId,
  isLoading,
  isError,
  error,
  children
}: {
  locale: "zh-CN" | "en";
  orderId?: string;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  children: ReactNode;
}) {
  if (!orderId) {
    return (
      <EmptyPanel
        title={localeText(locale, "缺少订单编号", "Missing order id")}
        description={localeText(
          locale,
          "当前没有可查询的订单。",
          "There is no order to display."
        )}
      />
    );
  }

  if (isLoading) {
    return (
      <StatePanel
        tone="loading"
        title={localeText(locale, "正在载入详情", "Loading details")}
        description={localeText(locale, "请稍候。", "Please wait.")}
      />
    );
  }

  if (isError) {
    return (
      <StatePanel
        tone="danger"
        title={localeText(locale, "详情暂时无法加载", "Order details are unavailable")}
        description={getErrorMessage(error)}
      />
    );
  }

  return <>{children}</>;
}
