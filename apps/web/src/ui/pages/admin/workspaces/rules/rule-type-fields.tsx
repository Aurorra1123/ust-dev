import type { Dispatch, SetStateAction } from "react";

import type { Locale } from "../../../../../store/locale-store";
import type { RuleEditorState } from "./rules-workspace-helpers";
import { AllowedRolesFields } from "./allowed-roles-fields";
import { MaxActiveReservationsFields } from "./max-active-reservations-fields";
import { MaxDurationFields } from "./max-duration-fields";
import { MinCreditScoreFields } from "./min-credit-score-fields";
import { NoShowPenaltyFields } from "./no-show-penalty-fields";

export function RuleTypeFields({
  locale,
  editor,
  setEditor
}: {
  locale: Locale;
  editor: RuleEditorState;
  setEditor: Dispatch<SetStateAction<RuleEditorState>>;
}) {
  switch (editor.ruleType) {
    case "max_duration_minutes":
      return <MaxDurationFields locale={locale} setEditor={setEditor} />;
    case "min_credit_score":
      return (
        <MinCreditScoreFields
          locale={locale}
          value={editor.minCreditScore}
          setEditor={setEditor}
        />
      );
    case "allowed_user_roles":
      return (
        <AllowedRolesFields
          locale={locale}
          allowedRoles={editor.allowedRoles}
          setEditor={setEditor}
        />
      );
    case "max_active_reservations_per_category":
      return (
        <MaxActiveReservationsFields
          locale={locale}
          value={editor.maxActiveReservations}
          setEditor={setEditor}
        />
      );
    case "no_show_credit_penalty":
      return (
        <NoShowPenaltyFields
          locale={locale}
          scoreDelta={editor.noShowScoreDelta}
          banDays={editor.noShowBanDays}
          setEditor={setEditor}
        />
      );
  }
}
