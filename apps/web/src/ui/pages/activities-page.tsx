import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  fetchActivities,
  fetchActivityDetail,
  fetchActivityRegistrationStatus,
  grabActivity
} from "../../lib/api/activity-api";
import { getErrorMessage } from "../../lib/http/errors";
import { localeText } from "../../lib/locale";
import { useLocaleStore } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel } from "../user-experience-kit";
import { ActivityListSidebar } from "./activities/activity-list-sidebar";
import { ActivityOverviewCard } from "./activities/activity-overview-card";
import { ActivityRegistrationStatusPanel } from "./activities/activity-registration-status-panel";
import { ActivityTicketsPanel } from "./activities/activity-tickets-panel";
import {
  getSelectedActivity,
  isActivitySoldOut
} from "./activities/activities-page-selectors";

export function ActivitiesPage() {
  const locale = useLocaleStore((state) => state.locale);
  const sessionStatus = useSessionStore((state) => state.status);
  const activitiesQuery = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities
  });
  const [activityId, setActivityId] = useState<string | null>(null);

  useEffect(() => {
    const firstActivity = activitiesQuery.data?.[0];

    if (!activityId && firstActivity) {
      setActivityId(firstActivity.id);
    }
  }, [activitiesQuery.data, activityId]);

  const selectedActivity = getSelectedActivity(activitiesQuery.data, activityId);

  const detailQuery = useQuery({
    queryKey: ["activity-detail", selectedActivity?.id],
    queryFn: () => fetchActivityDetail(selectedActivity!.id),
    enabled: !!selectedActivity?.id
  });

  const registrationStatusQuery = useQuery({
    queryKey: ["activity-registration-status", selectedActivity?.id],
    queryFn: () => fetchActivityRegistrationStatus(selectedActivity!.id),
    enabled: !!selectedActivity?.id && sessionStatus === "authenticated",
    refetchInterval: (query) =>
      query.state.data?.status === "queued" ? 2_000 : false
  });

  const grabMutation = useMutation({
    mutationFn: ({ activityId: currentActivityId, ticketId }: { activityId: string; ticketId: string }) =>
      grabActivity(currentActivityId, { ticketId }),
    onSuccess: async () => {
      await registrationStatusQuery.refetch();
    }
  });

  const soldOut = useMemo(() => isActivitySoldOut(selectedActivity), [selectedActivity]);

  return (
    <PageSection
      title={localeText(locale, "校园活动", "Campus Activities")}
      description={localeText(
        locale,
        "选择活动后查看票种并完成报名。",
        "Select an activity, review ticket types, and complete registration."
      )}
    >
      {activitiesQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入活动", "Loading activities")}
          description={localeText(locale, "请稍候。", "Please wait.")}
        />
      ) : activitiesQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "活动暂时无法加载", "Activities are unavailable")}
          description={getErrorMessage(activitiesQuery.error)}
        />
      ) : !activitiesQuery.data?.length ? (
        <EmptyPanel
          title={localeText(locale, "当前没有活动", "No activities available")}
          description={localeText(locale, "请稍后刷新。", "Please refresh later.")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px,minmax(0,1fr)]">
          <ActivityListSidebar
            activities={activitiesQuery.data}
            selectedActivityId={selectedActivity?.id}
            locale={locale}
            onSelect={setActivityId}
          />

          {selectedActivity ? (
            <div className="grid gap-4">
              <ActivityOverviewCard activity={selectedActivity} locale={locale} />

              <ActivityTicketsPanel
                locale={locale}
                activityId={selectedActivity.id}
                soldOut={soldOut}
                sessionStatus={sessionStatus}
                detail={detailQuery.data}
                isLoading={detailQuery.isLoading}
                isError={detailQuery.isError}
                error={detailQuery.isError ? detailQuery.error : null}
                isPending={grabMutation.isPending}
                onGrab={(currentActivityId, ticketId) =>
                  grabMutation.mutate({
                    activityId: currentActivityId,
                    ticketId
                  })
                }
              />

              {grabMutation.isError ? (
                <StatePanel
                  tone="danger"
                  title={localeText(locale, "报名未完成", "Registration failed")}
                  description={getErrorMessage(grabMutation.error)}
                />
              ) : null}

              {sessionStatus === "authenticated" ? (
                <ActivityRegistrationStatusPanel
                  locale={locale}
                  isLoading={registrationStatusQuery.isLoading}
                  isError={registrationStatusQuery.isError}
                  error={registrationStatusQuery.isError ? registrationStatusQuery.error : null}
                  status={registrationStatusQuery.data}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </PageSection>
  );
}
