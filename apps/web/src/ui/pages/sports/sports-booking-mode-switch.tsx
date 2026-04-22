import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";

export function SportsBookingModeSwitch({
  locale,
  mode,
  hasGroupedBooking,
  onModeChange
}: {
  locale: Locale;
  mode: "unit" | "group";
  hasGroupedBooking: boolean;
  onModeChange: (mode: "unit" | "group") => void;
}) {
  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm transition ${
            mode === "unit" ? "bg-ember text-white" : "bg-sand text-ink"
          }`}
          onClick={() => onModeChange("unit")}
          aria-pressed={mode === "unit"}
        >
          {localeText(locale, "单场地", "Single Court")}
        </button>
        {hasGroupedBooking ? (
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm transition ${
              mode === "group" ? "bg-ember text-white" : "bg-sand text-ink"
            }`}
            onClick={() => onModeChange("group")}
            aria-pressed={mode === "group"}
          >
            {localeText(locale, "组合预订", "Grouped Booking")}
          </button>
        ) : null}
      </div>
      {hasGroupedBooking ? (
        <p className="text-sm text-slate">
          {mode === "group"
            ? localeText(
                locale,
                "当前按整组场地一起预订，提交后会同时锁定所有成员场地。",
                "This mode books the full court set together. Submitting will lock every included court."
              )
            : localeText(
                locale,
                "只有当你需要同时占用一组关联场地时，再切到组合预订。",
                "Switch to grouped booking only when you need to reserve a linked set of courts together."
              )}
        </p>
      ) : null}
    </>
  );
}
