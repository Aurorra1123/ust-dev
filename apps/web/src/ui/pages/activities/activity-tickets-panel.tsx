import type { ActivityDetailResponse } from "@campusbook/shared-types";

import { getErrorMessage } from "../../../lib/http/errors";
import { localeText } from "../../../lib/locale";
import { StatePanel } from "../../user-experience-kit";
import { ActivityTicketCard } from "./activity-ticket-card";

export function ActivityTicketsPanel({
  locale,
  activityId,
  soldOut,
  sessionStatus,
  detail,
  isLoading,
  isError,
  error,
  isPending,
  onGrab
}: {
  locale: "zh-CN" | "en";
  activityId: string;
  soldOut: boolean;
  sessionStatus: "unknown" | "anonymous" | "authenticated";
  detail: ActivityDetailResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isPending: boolean;
  onGrab: (activityId: string, ticketId: string) => void;
}) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
      <h3 className="text-lg font-semibold text-ink">
        {localeText(locale, "票种", "Ticket Types")}
      </h3>
      {isLoading ? (
        <div className="mt-4">
          <StatePanel
            tone="loading"
            title={localeText(locale, "正在载入票种", "Loading ticket types")}
            description={localeText(locale, "请稍候。", "Please wait.")}
          />
        </div>
      ) : isError ? (
        <div className="mt-4">
          <StatePanel
            tone="danger"
            title={localeText(locale, "票种暂时无法加载", "Ticket types are unavailable")}
            description={getErrorMessage(error)}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {detail?.tickets.map((ticket) => (
            <ActivityTicketCard
              key={ticket.id}
              locale={locale}
              sessionStatus={sessionStatus}
              activityId={activityId}
              ticket={ticket}
              soldOut={soldOut}
              isPending={isPending}
              onGrab={onGrab}
            />
          ))}
        </div>
      )}
    </div>
  );
}
