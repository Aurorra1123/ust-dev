import type { Dispatch, SetStateAction } from "react";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import type { RuleEditorState } from "./rules-workspace-helpers";

export function NoShowPenaltyFields({
  locale,
  scoreDelta,
  banDays,
  setEditor
}: {
  locale: Locale;
  scoreDelta: number;
  banDays: number;
  setEditor: Dispatch<SetStateAction<RuleEditorState>>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <input
        type="number"
        min={1}
        className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
        value={scoreDelta}
        onChange={(event) =>
          setEditor((current) => ({
            ...current,
            noShowScoreDelta: Number(event.target.value)
          }))
        }
        placeholder={localeText(locale, "扣减信用分", "Credit score deduction")}
      />
      <input
        type="number"
        min={0}
        className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
        value={banDays}
        onChange={(event) =>
          setEditor((current) => ({
            ...current,
            noShowBanDays: Number(event.target.value)
          }))
        }
        placeholder={localeText(locale, "禁用天数", "Ban days")}
      />
    </div>
  );
}
