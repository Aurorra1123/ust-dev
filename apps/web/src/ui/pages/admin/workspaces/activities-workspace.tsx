import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createActivity,
  createActivityTicket,
  fetchAdminActivities,
  updateActivity
} from "../../../../lib/api/activity-api";
import { localeText } from "../../../../lib/locale";
import { queryClient } from "../../../../lib/query-client";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { ActivityListPanel } from "./activities/activity-list-panel";
import { ActivityStatusActions } from "./activities/activity-status-actions";
import {
  type ActivityFormState,
  type FirstTicketFormState,
  buildCreateActivityPayload,
  buildCreateTicketPayload,
  createDefaultActivityForm,
  createDefaultFirstTicketForm,
  createDefaultTicketForm,
  getSelectedActivity,
  resolveEffectiveFirstTicket,
  validateCreateActivityForm,
  validateCreateTicketForm
} from "./activities/activities-workspace-helpers";
import { CreateActivityPanel } from "./activities/create-activity-panel";
import { CreateTicketPanel } from "./activities/create-ticket-panel";
import { SelectedActivitySummary } from "./activities/selected-activity-summary";

export function ActivitiesWorkspace({ locale }: { locale: Locale }) {
  const activitiesQuery = useQuery({
    queryKey: ["admin", "activities"],
    queryFn: fetchAdminActivities
  });
  const [activityId, setActivityId] = useState("");
  const [activityForm, setActivityForm] = useState<ActivityFormState>(createDefaultActivityForm);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [customizeFirstTicket, setCustomizeFirstTicket] = useState(false);
  const [firstTicketForm, setFirstTicketForm] = useState<FirstTicketFormState>(() =>
    createDefaultFirstTicketForm(createDefaultActivityForm().totalQuota, locale)
  );
  const [ticketForm, setTicketForm] = useState(createDefaultTicketForm);

  useEffect(() => {
    const firstActivity = activitiesQuery.data?.[0];

    if (!activityId && firstActivity) {
      setActivityId(firstActivity.id);
    }
  }, [activityId, activitiesQuery.data]);

  const selectedActivity = getSelectedActivity(activitiesQuery.data, activityId);
  const effectiveFirstTicket = resolveEffectiveFirstTicket(
    activityForm,
    locale,
    customizeFirstTicket,
    firstTicketForm
  );
  const isCreateActivityValid = validateCreateActivityForm(
    activityForm,
    effectiveFirstTicket
  );
  const isCreateTicketValid = validateCreateTicketForm(selectedActivity, ticketForm);

  const createActivityMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: async (activity) => {
      const defaultActivityForm = createDefaultActivityForm();

      setActivityId(activity.id);
      setActivityForm(defaultActivityForm);
      setShowAdvancedSettings(false);
      setCustomizeFirstTicket(false);
      setFirstTicketForm(createDefaultFirstTicketForm(defaultActivityForm.totalQuota, locale));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "activities"] }),
        queryClient.invalidateQueries({ queryKey: ["activities"] })
      ]);
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: (payload: {
      activityId: string;
      name: string;
      stock: number;
      priceCents: number;
    }) => createActivityTicket(payload.activityId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "activities"] }),
        queryClient.invalidateQueries({ queryKey: ["activities"] })
      ]);
    }
  });

  const publishMutation = useMutation({
    mutationFn: (status: "published" | "closed") =>
      updateActivity(selectedActivity!.id, {
        status
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "activities"] }),
        queryClient.invalidateQueries({ queryKey: ["activities"] })
      ]);
    }
  });

  function handleCreateActivity() {
    createActivityMutation.mutate(
      buildCreateActivityPayload(activityForm, effectiveFirstTicket)
    );
  }

  function handleCreateTicket() {
    if (!selectedActivity) {
      return;
    }

    createTicketMutation.mutate(buildCreateTicketPayload(selectedActivity.id, ticketForm));
  }

  function handleCloseSelectedActivity() {
    if (!selectedActivity) {
      return;
    }

    if (
      !window.confirm(
        localeText(
          locale,
          "关闭后活动将停止对外售卖。确认继续吗？",
          "Closing the activity will stop ticket sales. Continue?"
        )
      )
    ) {
      return;
    }

    publishMutation.mutate("closed");
  }

  return (
    <PageSection
      title={localeText(locale, "活动管理", "Activity Management")}
      description={localeText(
        locale,
        "查看活动列表，维护活动信息、票种和发布状态。",
        "Review activities and maintain their details, ticket types, and publishing status."
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(28rem,42%)]">
        <div className="grid gap-4">
          <ActivityListPanel
            locale={locale}
            activities={activitiesQuery.data}
            selectedActivityId={selectedActivity?.id}
            isLoading={activitiesQuery.isLoading}
            isError={activitiesQuery.isError}
            error={activitiesQuery.error}
            onSelect={setActivityId}
          />

          {selectedActivity ? (
            <SelectedActivitySummary locale={locale} activity={selectedActivity} />
          ) : null}
        </div>

        <div className="grid gap-4">
          <CreateActivityPanel
            locale={locale}
            activityForm={activityForm}
            setActivityForm={setActivityForm}
            customizeFirstTicket={customizeFirstTicket}
            setCustomizeFirstTicket={setCustomizeFirstTicket}
            firstTicketForm={firstTicketForm}
            setFirstTicketForm={setFirstTicketForm}
            effectiveFirstTicket={effectiveFirstTicket}
            showAdvancedSettings={showAdvancedSettings}
            setShowAdvancedSettings={setShowAdvancedSettings}
            isValid={isCreateActivityValid}
            mutation={createActivityMutation}
            onSubmit={handleCreateActivity}
            onResetFirstTicket={() =>
              setFirstTicketForm(createDefaultFirstTicketForm(activityForm.totalQuota, locale))
            }
          />

          <CreateTicketPanel
            locale={locale}
            selectedActivity={selectedActivity}
            ticketForm={ticketForm}
            setTicketForm={setTicketForm}
            isValid={isCreateTicketValid}
            mutation={createTicketMutation}
            onSubmit={handleCreateTicket}
          />

          <ActivityStatusActions
            locale={locale}
            selectedActivity={selectedActivity}
            mutation={publishMutation}
            onPublish={() => publishMutation.mutate("published")}
            onClose={handleCloseSelectedActivity}
          />
        </div>
      </div>
    </PageSection>
  );
}
