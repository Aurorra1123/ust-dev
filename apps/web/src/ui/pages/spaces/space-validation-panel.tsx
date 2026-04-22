import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";
import { StatePanel } from "../../user-experience-kit";
import type {
  SelectedRange,
  SelectionConflict
} from "./spaces-helpers";

export function SpaceValidationPanel({
  locale,
  selectedRange,
  selectionConflict
}: {
  locale: Locale;
  selectedRange: SelectedRange | null;
  selectionConflict: SelectionConflict;
}) {
  if (!selectedRange) {
    return (
      <StatePanel
        tone="danger"
        title={localeText(locale, "请输入有效时间范围", "Enter a valid time range")}
        description={localeText(
          locale,
          "结束时间必须晚于开始时间。",
          "The end time must be later than the start time."
        )}
      />
    );
  }

  if (!selectionConflict) {
    return null;
  }

  return (
    <div id="spaces-booking-validation-message">
      <StatePanel
        tone={selectionConflict.tone}
        title={selectionConflict.title}
        description={selectionConflict.description}
      />
    </div>
  );
}
