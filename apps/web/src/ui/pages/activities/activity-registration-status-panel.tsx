import { Link } from "react-router-dom";

import type { ActivityRegistrationStatusResponse } from "@campusbook/shared-types";

import { getErrorMessage, getErrorStatus } from "../../../lib/http/errors";
import { localeText } from "../../../lib/locale";
import { StatePanel } from "../../user-experience-kit";
import { registrationStateLabel } from "./activities-page-selectors";

export function ActivityRegistrationStatusPanel({
  locale,
  isLoading,
  isError,
  error,
  status
}: {
  locale: "zh-CN" | "en";
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  status: ActivityRegistrationStatusResponse | undefined;
}) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
      <h3 className="text-lg font-semibold text-ink">
        {localeText(locale, "我的报名状态", "My Registration Status")}
      </h3>
      {isLoading ? (
        <div className="mt-4">
          <StatePanel
            tone="loading"
            title={localeText(locale, "正在读取状态", "Loading status")}
            description={localeText(locale, "请稍候。", "Please wait.")}
          />
        </div>
      ) : isError ? (
        getErrorStatus(error) === 404 ? (
          <div className="mt-4">
            <StatePanel
              title={localeText(locale, "还没有报名记录", "No registration yet")}
              description={localeText(
                locale,
                "提交后会显示在这里。",
                "Your registration status will appear here."
              )}
            />
          </div>
        ) : (
          <div className="mt-4">
            <StatePanel
              tone="danger"
              title={localeText(locale, "状态暂时无法读取", "Status is unavailable")}
              description={getErrorMessage(error)}
            />
          </div>
        )
      ) : status ? (
        <div className="mt-4 rounded-2xl bg-sand px-4 py-4 text-sm text-ink/75">
          <p className="font-medium text-ink">
            {localeText(locale, "当前状态：", "Current status: ")}
            {registrationStateLabel(status.status, locale)}
          </p>
          {status.orderId ? (
            <Link
              to={`/orders/${status.orderId}`}
              className="mt-3 inline-flex rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
            >
              {localeText(locale, "查看订单详情", "View Order Details")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
