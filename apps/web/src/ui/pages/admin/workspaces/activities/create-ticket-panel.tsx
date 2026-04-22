import type { Dispatch, SetStateAction } from "react";
import type { ActivityDetailResponse } from "@campusbook/shared-types";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { MutationState } from "../../components/mutation-state";
import { ActivityFieldBlock } from "./activity-field-block";
import type { TicketFormState } from "./activities-workspace-helpers";

type MutationStateLike = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
};

export function CreateTicketPanel({
  locale,
  selectedActivity,
  ticketForm,
  setTicketForm,
  isValid,
  mutation,
  onSubmit
}: {
  locale: Locale;
  selectedActivity: ActivityDetailResponse | null;
  ticketForm: TicketFormState;
  setTicketForm: Dispatch<SetStateAction<TicketFormState>>;
  isValid: boolean;
  mutation: MutationStateLike;
  onSubmit: () => void;
}) {
  return (
    <form
      className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h3 className="text-lg font-semibold text-ink">
        {localeText(locale, "活动加票", "Add Ticket Type")}
      </h3>
      <p className="mt-2 text-sm text-ink/70">
        {localeText(locale, "当前活动：", "Current activity: ")}
        {selectedActivity?.title ||
          localeText(locale, "请先选择左侧活动", "Select an activity from the left")}
      </p>
      <div className="mt-4 grid gap-4">
        <ActivityFieldBlock
          label={localeText(locale, "新增票种名称", "New Ticket Type")}
          hint={localeText(
            locale,
            "只有确实需要分档售卖时再新增票种，名称会直接展示在学生端。",
            "Add another ticket type only when you really need tiered sales. The name is shown directly to students."
          )}
        >
          <input
            className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={ticketForm.name}
            onChange={(event) =>
              setTicketForm((current) => ({
                ...current,
                name: event.target.value
              }))
            }
            placeholder={localeText(locale, "新增票种名称", "New ticket type")}
          />
        </ActivityFieldBlock>
        <div className="grid gap-4 sm:grid-cols-2">
          <ActivityFieldBlock
            label={localeText(locale, "库存", "Stock")}
            hint={localeText(
              locale,
              "库存表示这个票种最多还能售卖多少张，不应超过实际可分配额度。",
              "Stock is the maximum number of tickets this type can still sell and should not exceed the real allocatable quota."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              type="number"
              min={1}
              value={ticketForm.stock}
              onChange={(event) =>
                setTicketForm((current) => ({
                  ...current,
                  stock: Number(event.target.value)
                }))
              }
              placeholder={localeText(locale, "库存", "Stock")}
            />
          </ActivityFieldBlock>
          <ActivityFieldBlock
            label={localeText(locale, "票价（分）", "Ticket Price (cents)")}
            hint={localeText(
              locale,
              "价格字段统一用分存储，`0` 代表免费票。",
              "Ticket prices are stored in cents, and `0` means the ticket is free."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              type="number"
              min={0}
              value={ticketForm.priceCents}
              onChange={(event) =>
                setTicketForm((current) => ({
                  ...current,
                  priceCents: Number(event.target.value)
                }))
              }
              placeholder={localeText(locale, "价格分", "Price in cents")}
            />
          </ActivityFieldBlock>
        </div>
      </div>
      <MutationState
        mutation={mutation}
        success={localeText(locale, "票种已追加。", "Ticket type added.")}
        pending={localeText(locale, "正在追加票种。", "Adding ticket type.")}
      />
      <button
        type="submit"
        className="mt-4 w-full rounded-full bg-moss px-5 py-3 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:bg-moss/50"
        disabled={!isValid || mutation.isPending}
      >
        {mutation.isPending
          ? localeText(locale, "提交中", "Submitting")
          : localeText(locale, "新增票种", "Add Ticket Type")}
      </button>
    </form>
  );
}
