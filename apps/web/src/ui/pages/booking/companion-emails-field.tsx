import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";

export function CompanionEmailsField({
  locale,
  idPrefix,
  value,
  onChange
}: {
  locale: Locale;
  idPrefix: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const helpId = `${idPrefix}-companion-help`;
  const textareaId = `${idPrefix}-companion-emails`;

  return (
    <>
      <label className="grid gap-2 text-sm text-ink/75" htmlFor={textareaId}>
        {localeText(locale, "同行人邮箱", "Companion Emails")}
        <textarea
          id={textareaId}
          className="min-h-[88px] rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={helpId}
        />
      </label>
      <p id={helpId} className="text-xs leading-6 text-slate">
        {localeText(
          locale,
          "可选。输入多个邮箱时可使用逗号、空格或换行分隔。",
          "Optional. Separate multiple emails with commas, spaces, or line breaks."
        )}
      </p>
    </>
  );
}
