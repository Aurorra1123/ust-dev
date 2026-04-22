import type { ActivityDetailResponse } from "@campusbook/shared-types";

import { localeText } from "../../../lib/locale";
import { StatusPill } from "../../user-experience-kit";
import {
  getTicketRemaining,
  isGrabDisabled,
  isTicketSoldOut
} from "./activities-page-selectors";

export function ActivityTicketCard({
  locale,
  sessionStatus,
  activityId,
  ticket,
  soldOut,
  isPending,
  onGrab
}: {
  locale: "zh-CN" | "en";
  sessionStatus: "unknown" | "anonymous" | "authenticated";
  activityId: string;
  ticket: ActivityDetailResponse["tickets"][number];
  soldOut: boolean;
  isPending: boolean;
  onGrab: (activityId: string, ticketId: string) => void;
}) {
  const remaining = getTicketRemaining(ticket);
  const ticketSoldOut = isTicketSoldOut(ticket);

  return (
    <div className="rounded-2xl border border-ink/10 bg-sand px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-ink">{ticket.name}</p>
            <StatusPill tone={ticketSoldOut ? "danger" : "success"}>
              {ticketSoldOut
                ? localeText(locale, "该票种已满", "Sold Out")
                : localeText(locale, "该票种可报名", "Open")}
            </StatusPill>
          </div>
          <p className="mt-2 text-sm text-slate">
            {localeText(
              locale,
              `库存 ${ticket.stock} / 已保留 ${ticket.reserved}`,
              `Stock ${ticket.stock} / Reserved ${ticket.reserved}`
            )}
          </p>
          <p
            id={`ticket-availability-${ticket.id}`}
            className="mt-2 text-sm font-medium text-ink"
          >
            {ticketSoldOut
              ? localeText(
                  locale,
                  "当前剩余 0 张，提交按钮会保持禁用。",
                  "No seats remain. The action button stays disabled."
                )
              : localeText(
                  locale,
                  `当前剩余 ${remaining} 张。`,
                  `${remaining} tickets remain.`
                )}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-ember px-4 py-2 text-sm text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
          disabled={
            isGrabDisabled({
              sessionStatus,
              isPending,
              soldOut,
              ticketSoldOut
            })
          }
          onClick={() => onGrab(activityId, ticket.id)}
          aria-describedby={`ticket-availability-${ticket.id}`}
        >
          {sessionStatus === "authenticated"
            ? isPending
              ? localeText(locale, "提交中", "Submitting")
              : localeText(locale, "立即报名", "Register Now")
            : localeText(locale, "请先登录", "Sign In")}
        </button>
      </div>
    </div>
  );
}
