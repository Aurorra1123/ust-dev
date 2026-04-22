import type { Dispatch, SetStateAction } from "react";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import type { RuleEditorState } from "./rules-workspace-helpers";

export function MinCreditScoreFields({
  locale,
  value,
  setEditor
}: {
  locale: Locale;
  value: number;
  setEditor: Dispatch<SetStateAction<RuleEditorState>>;
}) {
  return (
    <input
      type="number"
      min={0}
      className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
      value={value}
      onChange={(event) =>
        setEditor((current) => ({
          ...current,
          minCreditScore: Number(event.target.value)
        }))
      }
      placeholder={localeText(locale, "最低信用分", "Minimum credit score")}
    />
  );
}
