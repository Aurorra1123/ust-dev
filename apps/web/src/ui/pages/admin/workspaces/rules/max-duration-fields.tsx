import type { Dispatch, SetStateAction } from "react";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import type { RuleEditorState } from "./rules-workspace-helpers";

export function MaxDurationFields({
  locale,
  setEditor
}: {
  locale: Locale;
  setEditor: Dispatch<SetStateAction<RuleEditorState>>;
}) {
  return (
    <input
      type="number"
      min={1}
      className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
      onChange={(event) =>
        setEditor((current) => ({
          ...current,
          maxDurationMinutes: Number(event.target.value)
        }))
      }
      placeholder={localeText(
        locale,
        "最长预约时长（分钟）",
        "Maximum duration (minutes)"
      )}
    />
  );
}
