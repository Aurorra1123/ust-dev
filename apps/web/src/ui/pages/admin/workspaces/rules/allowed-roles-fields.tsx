import type { Dispatch, SetStateAction } from "react";

import { roleLabel, type RuleEditorState } from "./rules-workspace-helpers";
import type { Locale } from "../../../../../store/locale-store";

export function AllowedRolesFields({
  locale,
  allowedRoles,
  setEditor
}: {
  locale: Locale;
  allowedRoles: RuleEditorState["allowedRoles"];
  setEditor: Dispatch<SetStateAction<RuleEditorState>>;
}) {
  return (
    <div className="grid gap-2">
      {(["student", "admin"] as const).map((role) => {
        const checked = allowedRoles.includes(role);

        return (
          <label
            key={role}
            className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm text-ink"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) =>
                setEditor((current) => ({
                  ...current,
                  allowedRoles: event.target.checked
                    ? Array.from(new Set([...current.allowedRoles, role]))
                    : current.allowedRoles.filter((item) => item !== role)
                }))
              }
            />
            <span>{roleLabel(role, locale)}</span>
          </label>
        );
      })}
    </div>
  );
}
