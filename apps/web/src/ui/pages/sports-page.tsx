import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  createSportsReservation,
  fetchResourceDetail,
  fetchResourceReservationStatus,
  fetchResources
} from "../../lib/api/resource-api";
import { ApiError } from "../../lib/http/errors";
import {
  addHours,
  startOfHour,
  startOfNextHour
} from "../../lib/date";
import { localeText } from "../../lib/locale";
import { queryClient } from "../../lib/query-client";
import { useLocaleStore } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";
import { parseCompanionEmails } from "../helpers/reservation-input";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel } from "../user-experience-kit";
import { SportsBookingPanel } from "./sports/sports-booking-panel";
import { buildAvailableTargets } from "./sports/sports-helpers";
import { SportsSchedulePanel } from "./sports/sports-schedule-panel";

const SLOT_COUNT = 8;

export function SportsPage() {
  const navigate = useNavigate();
  const locale = useLocaleStore((state) => state.locale);
  const sessionStatus = useSessionStore((state) => state.status);
  const [resourceId, setResourceId] = useState("");
  const [mode, setMode] = useState<"unit" | "group">("unit");
  const [targetId, setTargetId] = useState("");
  const [slotStarts, setSlotStarts] = useState<string[]>([]);
  const [companionEmailsText, setCompanionEmailsText] = useState("");
  const [displayStart, setDisplayStart] = useState(() => startOfHour(new Date()));

  const resourcesQuery = useQuery({
    queryKey: ["resources", "sports_facility"],
    queryFn: () => fetchResources("sports_facility")
  });
  const resourceDetailQuery = useQuery({
    queryKey: ["resource-detail", resourceId],
    queryFn: () => fetchResourceDetail(resourceId),
    enabled: Boolean(resourceId)
  });

  const displayEnd = useMemo(() => addHours(displayStart, SLOT_COUNT), [displayStart]);
  const scheduleQuery = useQuery({
    queryKey: [
      "resource-reservation-status",
      resourceId,
      displayStart.toISOString(),
      displayEnd.toISOString()
    ],
    queryFn: () =>
      fetchResourceReservationStatus(resourceId, {
        from: displayStart.toISOString(),
        to: displayEnd.toISOString()
      }),
    enabled: Boolean(resourceId)
  });

  const currentResource =
    resourceDetailQuery.data ??
    (resourceId ? null : null);

  const currentResourceSummary =
    resourcesQuery.data?.find((resource) => resource.id === resourceId) ??
    resourcesQuery.data?.[0] ??
    null;
  const hasGroupedBooking = (currentResource?.groups.length ?? 0) > 0;
  const resourceUnitNameMap = useMemo(
    () => new Map(currentResource?.units.map((unit) => [unit.id, unit.name]) ?? []),
    [currentResource]
  );

  const slotMoments = useMemo(
    () => Array.from({ length: SLOT_COUNT }, (_, index) => addHours(displayStart, index)),
    [displayStart]
  );

  const availableTargets = useMemo(
    () =>
      buildAvailableTargets({
        currentResource,
        mode,
        resourceUnitNameMap,
        locale
      }),
    [currentResource, locale, mode, resourceUnitNameMap]
  );

  const selectedGroup = useMemo(
    () => currentResource?.groups.find((group) => group.id === targetId) ?? null,
    [currentResource, targetId]
  );
  const selectedGroupUnitIds = useMemo(
    () => new Set(selectedGroup?.items.map((item) => item.resourceUnitId) ?? []),
    [selectedGroup]
  );
  const selectedGroupMemberNames = useMemo(
    () =>
      selectedGroup?.items.map(
        (item) => resourceUnitNameMap.get(item.resourceUnitId) ?? item.resourceUnitId
      ) ?? [],
    [resourceUnitNameMap, selectedGroup]
  );

  useEffect(() => {
    const firstResource = resourcesQuery.data?.[0];

    if (!resourceId && firstResource) {
      setResourceId(firstResource.id);
    }
  }, [resourceId, resourcesQuery.data]);

  useEffect(() => {
    if (!currentResource) {
      return;
    }

    if (mode === "group" && currentResource.groups.length === 0) {
      setMode("unit");
    }
  }, [currentResource, mode]);

  useEffect(() => {
    const firstTarget = availableTargets[0];

    if (!targetId && firstTarget) {
      setTargetId(firstTarget.id);
    }
  }, [availableTargets, targetId]);

  useEffect(() => {
    setTargetId(availableTargets[0]?.id ?? "");
    setSlotStarts([]);
  }, [mode, resourceId, availableTargets]);

  const sportsMutation = useMutation({
    mutationFn: createSportsReservation,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["resource-reservation-status", resourceId] })
      ]);
      navigate(`/orders/${result.orderId}`);
    }
  });

  const bookingThreshold = useMemo(() => startOfNextHour(new Date()), []);
  const currentHourStart = useMemo(() => startOfHour(new Date()), []);

  function toggleSlot(slotStartIso: string) {
    setSlotStarts((current) =>
      current.includes(slotStartIso)
        ? current.filter((item) => item !== slotStartIso)
        : [...current, slotStartIso].sort()
    );
  }

  return (
    <PageSection
      title={localeText(locale, "体育馆预约", "Sports Booking")}
      description={localeText(
        locale,
        "左侧资源，中间时间表，右侧状态说明与提交。",
        "Resources on the left, schedule in the middle, and submission controls on the right."
      )}
    >
      {resourcesQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入体育资源", "Loading sports resources")}
          description={localeText(locale, "请稍候。", "Please wait.")}
        />
      ) : resourcesQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "体育资源暂时无法加载", "Sports resources are unavailable")}
          description={(resourcesQuery.error as ApiError).message}
        />
      ) : !resourcesQuery.data?.length ? (
        <EmptyPanel
          title={localeText(locale, "当前没有体育资源", "No sports resources")}
          description={localeText(locale, "请稍后刷新。", "Please refresh later.")}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[260px,minmax(0,1fr),320px]">
          <aside className="grid gap-4">
            <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
              <p className="text-sm font-semibold text-ink">
                {localeText(locale, "资源", "Resources")}
              </p>
              <div className="mt-4 grid gap-3">
                {resourcesQuery.data.map((resource) => (
                  <button
                    key={resource.id}
                    type="button"
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      resource.id === currentResourceSummary?.id
                        ? "border-ember bg-ember/10"
                        : "border-ink/10 bg-sand hover:border-moss"
                    }`}
                    onClick={() => setResourceId(resource.id)}
                    >
                    <p className="text-sm font-semibold text-ink">{resource.name}</p>
                    <p className="mt-1 text-xs text-ink/45">
                      {localeText(
                        locale,
                        `${resource.unitCount} 个单元`,
                        `${resource.unitCount} units`
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {currentResource ? (
              <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                <p className="text-sm font-semibold text-ink">{currentResource.name}</p>
                <p className="mt-2 text-sm text-slate">
                  {currentResource.location ||
                    localeText(locale, "校内位置待补充", "Campus location to be added")}
                </p>
              </div>
            ) : null}
          </aside>

          <SportsSchedulePanel
            locale={locale}
            currentResource={currentResource}
            displayStart={displayStart}
            slotMoments={slotMoments}
            schedule={scheduleQuery.data}
            isLoading={scheduleQuery.isLoading}
            isError={scheduleQuery.isError}
            error={scheduleQuery.error as Error | null}
            currentHourStart={currentHourStart}
            bookingThreshold={bookingThreshold}
            mode={mode}
            targetId={targetId}
            slotStarts={slotStarts}
            selectedGroup={selectedGroup}
            selectedGroupUnitIds={selectedGroupUnitIds}
            onMovePrevious={() => setDisplayStart(addHours(displayStart, -SLOT_COUNT))}
            onMoveNext={() => setDisplayStart(addHours(displayStart, SLOT_COUNT))}
            onToggleSlot={toggleSlot}
            onSelectUnit={(unitId, slotStartIso) => {
              setTargetId(unitId);
              toggleSlot(slotStartIso);
            }}
          />

          <SportsBookingPanel
            locale={locale}
            sessionStatus={sessionStatus}
            mode={mode}
            hasGroupedBooking={hasGroupedBooking}
            availableTargets={availableTargets}
            targetId={targetId}
            slotStarts={slotStarts}
            selectedGroup={selectedGroup}
            selectedGroupMemberNames={selectedGroupMemberNames}
            companionEmailsText={companionEmailsText}
            isPending={sportsMutation.isPending}
            error={sportsMutation.error as Error | null}
            onModeChange={setMode}
            onTargetChange={(nextTargetId) => {
              setTargetId(nextTargetId);
              setSlotStarts([]);
            }}
            onToggleSlot={toggleSlot}
            onCompanionEmailsChange={setCompanionEmailsText}
            onSubmit={() =>
              sportsMutation.mutate({
                ...(mode === "group"
                  ? { resourceGroupId: targetId }
                  : { resourceUnitId: targetId }),
                slotStarts,
                companionEmails: parseCompanionEmails(companionEmailsText)
              })
            }
          />
        </div>
      )}
    </PageSection>
  );
}
