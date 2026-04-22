import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ResourceType } from "@campusbook/shared-types";

import { cancelOrder } from "../../../../lib/api/order-api";
import {
  createResource,
  createResourceBookingClosures,
  createResourceReleaseRules,
  createResourceUnit,
  deleteResource,
  deleteResourceBookingClosure,
  deleteResourceUnit,
  fetchAdminResourceReservationStatus,
  fetchAdminResources,
  updateResource
} from "../../../../lib/api/resource-api";
import { getErrorMessage } from "../../../../lib/http/errors";
import { localeText } from "../../../../lib/locale";
import { queryClient } from "../../../../lib/query-client";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { EmptyPanel, StatePanel } from "../../../user-experience-kit";
import { ResourcesActionsPanel } from "./resources/resources-actions-panel";
import { ResourcesCatalogPanel } from "./resources/resources-catalog-panel";
import { ResourcesDetailPanel } from "./resources/resources-detail-panel";
import {
  alignResourceUnitFormToResource,
  buildAcademicAreaGroups,
  createDefaultBookingClosureFormState,
  createDefaultReleaseRuleFormState,
  createDefaultResourceFormState,
  createDefaultResourceUnitFormState,
  createDefaultStatusWindow,
  extractAcademicAreaKey,
  type StatusWindowState
} from "./resources/resources-workspace-helpers";

type ResourceWorkspaceDomain = "all" | "sports" | "academic";

export function ResourcesWorkspace({
  locale,
  domain = "all"
}: {
  locale: Locale;
  domain?: ResourceWorkspaceDomain;
}) {
  const resourcesQuery = useQuery({
    queryKey: ["admin", "resources"],
    queryFn: fetchAdminResources
  });
  const lockedResourceType: ResourceType | null =
    domain === "sports"
      ? "sports_facility"
      : domain === "academic"
        ? "academic_space"
        : null;
  const [resourceId, setResourceId] = useState("");
  const [academicAreaKey, setAcademicAreaKey] = useState("");
  const [resourceForm, setResourceForm] = useState(() =>
    createDefaultResourceFormState(lockedResourceType ?? "academic_space")
  );
  const [resourceUnitForm, setResourceUnitForm] = useState(
    createDefaultResourceUnitFormState
  );
  const [resourceOperationTargets, setResourceOperationTargets] = useState<string[]>([]);
  const [showAdvancedScheduling, setShowAdvancedScheduling] = useState(false);
  const [releaseRuleForm, setReleaseRuleForm] = useState(
    createDefaultReleaseRuleFormState
  );
  const [bookingClosureForm, setBookingClosureForm] = useState(
    createDefaultBookingClosureFormState
  );
  const [statusWindow, setStatusWindow] = useState(createDefaultStatusWindow);

  const domainResources = useMemo(() => {
    const resources = resourcesQuery.data ?? [];

    if (!lockedResourceType) {
      return resources;
    }

    return resources.filter((resource) => resource.type === lockedResourceType);
  }, [lockedResourceType, resourcesQuery.data]);
  const academicAreaGroups = useMemo(
    () =>
      domain === "academic"
        ? buildAcademicAreaGroups(domainResources, locale)
        : [],
    [domain, domainResources, locale]
  );
  const visibleResources = useMemo(() => {
    if (domain !== "academic") {
      return domainResources;
    }

    return (
      academicAreaGroups.find((group) => group.key === academicAreaKey)?.resources ?? []
    );
  }, [academicAreaGroups, academicAreaKey, domain, domainResources]);

  useEffect(() => {
    if (domain !== "academic") {
      return;
    }

    const firstArea = academicAreaGroups[0]?.key ?? "";

    if (
      !academicAreaKey ||
      !academicAreaGroups.some((group) => group.key === academicAreaKey)
    ) {
      setAcademicAreaKey(firstArea);
    }
  }, [academicAreaGroups, academicAreaKey, domain]);

  useEffect(() => {
    const firstResource = visibleResources[0];

    if (!visibleResources.some((resource) => resource.id === resourceId)) {
      setResourceId(firstResource?.id ?? "");
    }
  }, [resourceId, visibleResources]);

  useEffect(() => {
    if (!lockedResourceType) {
      return;
    }

    setResourceForm((current) =>
      current.type === lockedResourceType
        ? current
        : {
            ...current,
            type: lockedResourceType
          }
    );
  }, [lockedResourceType]);

  const selectedResource =
    visibleResources.find((resource) => resource.id === resourceId) ??
    visibleResources[0] ??
    null;
  const hasReleaseStrategy = (selectedResource?.releaseRules.length ?? 0) > 0;
  const showSchedulingSettings = hasReleaseStrategy || showAdvancedScheduling;
  const isCreateResourceValid =
    resourceForm.code.trim().length > 0 && resourceForm.name.trim().length > 0;
  const isCreateResourceUnitValid =
    Boolean(selectedResource) &&
    resourceUnitForm.code.trim().length > 0 &&
    resourceUnitForm.name.trim().length > 0 &&
    resourceUnitForm.unitType.trim().length > 0;

  useEffect(() => {
    if (!selectedResource) {
      return;
    }

    setResourceUnitForm((current) =>
      alignResourceUnitFormToResource(current, selectedResource)
    );
  }, [selectedResource]);

  useEffect(() => {
    if (!selectedResource) {
      setResourceOperationTargets([]);
      return;
    }

    setResourceOperationTargets((current) =>
      current.length > 0 ? current : [selectedResource.id]
    );
  }, [selectedResource]);

  useEffect(() => {
    setShowAdvancedScheduling(false);
  }, [selectedResource?.id]);

  const createResourceMutation = useMutation({
    mutationFn: createResource,
    onSuccess: async (resource) => {
      if (domain === "academic") {
        setAcademicAreaKey(extractAcademicAreaKey(resource.code));
      }

      setResourceId(resource.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const createResourceUnitMutation = useMutation({
    mutationFn: (payload: {
      resourceId: string;
      code: string;
      name: string;
      unitType: string;
      availabilityMode: "continuous" | "discrete_slot";
      capacity: number;
    }) => {
      const { resourceId: targetResourceId, ...unitPayload } = payload;

      return createResourceUnit(targetResourceId, unitPayload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const updateResourceStatusMutation = useMutation({
    mutationFn: (payload: { resourceId: string; status: "active" | "inactive" }) =>
      updateResource(payload.resourceId, { status: payload.status }),
    onSuccess: async (resource) => {
      setResourceId(resource.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "resource-status"] })
      ]);
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (currentResourceId: string) => deleteResource(currentResourceId),
    onSuccess: async () => {
      setResourceId("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "resource-status"] })
      ]);
    }
  });

  const deleteResourceUnitMutation = useMutation({
    mutationFn: (payload: { resourceId: string; unitId: string }) =>
      deleteResourceUnit(payload.resourceId, payload.unitId),
    onSuccess: async (resource) => {
      setResourceId(resource.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "resource-status"] })
      ]);
    }
  });

  const createReleaseRuleMutation = useMutation({
    mutationFn: createResourceReleaseRules,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "resource-status"] })
      ]);
    }
  });

  const createBookingClosureMutation = useMutation({
    mutationFn: createResourceBookingClosures,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "resource-status"] })
      ]);
    }
  });

  const deleteBookingClosureMutation = useMutation({
    mutationFn: (closureId: string) => deleteResourceBookingClosure(closureId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "resource-status"] })
      ]);
    }
  });

  const cancelReservationMutation = useMutation({
    mutationFn: (payload: { orderId: string; reason: string }) =>
      cancelOrder(payload.orderId, payload.reason),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resource-status"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] })
      ]);
    }
  });

  const resourceStatusQuery = useQuery({
    queryKey: [
      "admin",
      "resource-status",
      selectedResource?.id ?? "none",
      statusWindow.from,
      statusWindow.to
    ],
    queryFn: () =>
      fetchAdminResourceReservationStatus(selectedResource!.id, {
        from: new Date(statusWindow.from).toISOString(),
        to: new Date(statusWindow.to).toISOString()
      }),
    enabled: Boolean(selectedResource)
  });

  function handleToggleResourceOperationTarget(resourceId: string, nextChecked: boolean) {
    setResourceOperationTargets((current) =>
      nextChecked
        ? Array.from(new Set([...current, resourceId]))
        : current.filter((id) => id !== resourceId)
    );
  }

  function handleStatusWindowChange(field: keyof StatusWindowState, value: string) {
    setStatusWindow((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleToggleResourceStatus() {
    if (!selectedResource) {
      return;
    }

    const nextStatus = selectedResource.status === "active" ? "inactive" : "active";

    if (
      nextStatus === "inactive" &&
      !window.confirm(
        localeText(
          locale,
          "停用后学生端将不再看到该资源。确认继续吗？",
          "After deactivation, students will no longer see this resource. Continue?"
        )
      )
    ) {
      return;
    }

    updateResourceStatusMutation.mutate({
      resourceId: selectedResource.id,
      status: nextStatus
    });
  }

  function handleDeleteResource() {
    if (!selectedResource) {
      return;
    }

    if (
      !window.confirm(
        localeText(
          locale,
          "仅当该资源没有资源单元、规则绑定、关闭规则、开放策略和历史预约记录时，才允许彻底删除。确认继续吗？",
          "The resource can only be deleted when it has no units, bindings, closure rules, opening strategies, or reservation history. Continue?"
        )
      )
    ) {
      return;
    }

    deleteResourceMutation.mutate(selectedResource.id);
  }

  function handleDeleteResourceUnit(unitId: string) {
    if (!selectedResource) {
      return;
    }

    if (
      !window.confirm(
        localeText(
          locale,
          "仅当该资源单元没有历史预约、订单记录或组合场地绑定时，才允许删除。确认继续吗？",
          "The unit can only be deleted when it has no reservation history, order records, or group bindings. Continue?"
        )
      )
    ) {
      return;
    }

    deleteResourceUnitMutation.mutate({
      resourceId: selectedResource.id,
      unitId
    });
  }

  function handleCreateResource() {
    createResourceMutation.mutate({
      ...resourceForm,
      type: lockedResourceType ?? resourceForm.type
    });
  }

  function handleCreateResourceUnit() {
    if (!selectedResource) {
      return;
    }

    createResourceUnitMutation.mutate({
      resourceId: selectedResource.id,
      ...resourceUnitForm
    });
  }

  function handleCreateBookingClosure() {
    if (!resourceOperationTargets.length) {
      return;
    }

    createBookingClosureMutation.mutate({
      resourceIds: resourceOperationTargets,
      startsAt: new Date(bookingClosureForm.startsAt).toISOString(),
      endsAt: bookingClosureForm.indefinite
        ? null
        : new Date(bookingClosureForm.endsAt).toISOString(),
      reason: bookingClosureForm.reason
    });
  }

  function handleCreateReleaseRule() {
    if (!resourceOperationTargets.length) {
      return;
    }

    createReleaseRuleMutation.mutate({
      resourceIds: resourceOperationTargets,
      frequency: releaseRuleForm.frequency,
      dayOfWeek:
        releaseRuleForm.frequency === "weekly" ? releaseRuleForm.dayOfWeek : undefined,
      dayOfMonth:
        releaseRuleForm.frequency === "monthly" ? releaseRuleForm.dayOfMonth : undefined,
      hour: releaseRuleForm.hour,
      minute: releaseRuleForm.minute
    });
  }

  function handleDeleteBookingClosure(closureId: string) {
    if (
      !window.confirm(
        localeText(
          locale,
          "删除后该预约关闭规则将立即失效。确认继续吗？",
          "Deleting this booking closure will remove it immediately. Continue?"
        )
      )
    ) {
      return;
    }

    deleteBookingClosureMutation.mutate(closureId);
  }

  function handleCancelReservation(orderId: string) {
    cancelReservationMutation.mutate({
      orderId,
      reason: localeText(
        locale,
        "管理员从资源工作台取消预约",
        "Cancelled by admin from resource workspace"
      )
    });
  }

  const workspaceTitle =
    domain === "sports"
      ? localeText(locale, "体育场馆", "Sports Venues")
      : domain === "academic"
        ? localeText(locale, "学术空间", "Academic Spaces")
        : localeText(locale, "资源工作区", "Resource Workspace");
  const workspaceDescription =
    domain === "sports"
      ? localeText(
          locale,
          "这里集中维护体育场馆、场地单元、关闭规则、开放策略和预约状态。进入模块后默认就是体育设施上下文，不再混入学术空间。",
          "Manage sports venues, court units, closures, opening strategies, and reservation status here. This module stays in the sports-facility context and no longer mixes in academic spaces."
        )
      : domain === "academic"
        ? localeText(
            locale,
            "这里集中维护学术空间、房间单元、关闭规则、开放策略和预约状态。你可以先按 E1/E2/E3/E4 等区域查看，再管理对应空间。",
            "Manage academic spaces, room units, closures, opening strategies, and reservation status here. Review spaces by E1/E2/E3/E4-style areas first, then work on the matching rooms."
          )
        : localeText(
            locale,
            "这里集中处理资源列表、预约开放策略、预约通道关闭和预约状态查看。左侧先选资源，中间看当前状态，右侧执行新增和配置操作。",
            "This workspace manages the resource list, booking opening strategy, booking closures, and reservation status. Select a resource on the left, review its current status in the center, and configure updates on the right."
          );
  const loadingTitle =
    domain === "sports"
      ? localeText(locale, "正在载入体育场馆", "Loading sports venues")
      : domain === "academic"
        ? localeText(locale, "正在载入学术空间", "Loading academic spaces")
        : localeText(locale, "正在载入资源工作区", "Loading resource workspace");
  const loadingDescription =
    domain === "sports"
      ? localeText(
          locale,
          "页面正在整理当前可维护的体育场馆、开放策略和预约状态。",
          "The page is loading sports venues, opening strategies, and reservation status."
        )
      : domain === "academic"
        ? localeText(
            locale,
            "页面正在整理当前可维护的学术空间、区域分组和预约状态。",
            "The page is loading academic spaces, area groups, and reservation status."
          )
        : localeText(
            locale,
            "页面正在整理当前可维护的资源、开放策略和预约状态。",
            "The page is loading current resources, opening strategies, and reservation status."
          );
  const errorTitle =
    domain === "sports"
      ? localeText(locale, "体育场馆暂时无法加载", "Sports venues are unavailable")
      : domain === "academic"
        ? localeText(locale, "学术空间暂时无法加载", "Academic spaces are unavailable")
        : localeText(locale, "资源工作区暂时无法加载", "Resource workspace is unavailable");
  const emptyTitle =
    domain === "sports"
      ? localeText(locale, "当前还没有体育场馆", "No sports venues yet")
      : domain === "academic"
        ? localeText(locale, "当前还没有学术空间", "No academic spaces yet")
        : localeText(locale, "当前还没有资源", "No resources yet");
  const emptyDescription =
    domain === "sports"
      ? localeText(
          locale,
          "可以先在右侧创建体育场馆，再补具体场地单元和开放策略。",
          "Create a sports venue on the right first, then add specific courts and opening strategies."
        )
      : domain === "academic"
        ? localeText(
            locale,
            "可以先在右侧创建学术空间。命名规范符合 E1/E2/E3/E4 等前缀时，会自动进入对应区域。",
            "Create an academic space on the right first. Codes that start with E1/E2/E3/E4 and similar prefixes will be grouped into the matching area automatically."
          )
        : localeText(locale, "可以先在右侧创建资源。", "Create a resource on the right first.");

  return (
    <PageSection
      title={workspaceTitle}
      description={workspaceDescription}
    >
      {resourcesQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={loadingTitle}
          description={loadingDescription}
        />
      ) : resourcesQuery.isError ? (
        <StatePanel
          tone="danger"
          title={errorTitle}
          description={getErrorMessage(resourcesQuery.error)}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),340px]">
          <div className="grid gap-4">
            {domain === "academic" && academicAreaGroups.length ? (
              <div className="rounded-[26px] border border-navy/10 bg-white px-5 py-5">
                <p className="text-xs uppercase tracking-[0.2em] text-moss">
                  {localeText(locale, "区域索引", "Area Index")}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-ink">
                  {localeText(locale, "先按区域查看学术空间", "Review academic spaces by area first")}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {academicAreaGroups.map((group) => (
                    <button
                      key={group.key}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        academicAreaKey === group.key
                          ? "border-ember bg-ember text-white"
                          : "border-navy/10 bg-sand text-ink hover:border-moss"
                      }`}
                      onClick={() => setAcademicAreaKey(group.key)}
                    >
                      {group.label} · {group.resources.length}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {visibleResources.length ? (
              <>
                <ResourcesCatalogPanel
                  locale={locale}
                  resources={visibleResources}
                  selectedResourceId={selectedResource?.id ?? null}
                  onSelectResource={setResourceId}
                />
                <ResourcesDetailPanel
                  locale={locale}
                  resources={visibleResources}
                  selectedResource={selectedResource}
                  resourceOperationTargets={resourceOperationTargets}
                  onToggleResourceOperationTarget={handleToggleResourceOperationTarget}
                  onToggleResourceStatus={handleToggleResourceStatus}
                  onDeleteResource={handleDeleteResource}
                  onDeleteResourceUnit={handleDeleteResourceUnit}
                  onDeleteBookingClosure={handleDeleteBookingClosure}
                  updateResourceStatusMutation={updateResourceStatusMutation}
                  deleteResourceMutation={deleteResourceMutation}
                  deleteResourceUnitMutation={deleteResourceUnitMutation}
                  deleteBookingClosureMutation={deleteBookingClosureMutation}
                  statusWindow={statusWindow}
                  onStatusWindowChange={handleStatusWindowChange}
                  resourceStatusQuery={{
                    data: resourceStatusQuery.data,
                    isLoading: resourceStatusQuery.isLoading,
                    isError: resourceStatusQuery.isError,
                    error: (resourceStatusQuery.error as Error | null) ?? null
                  }}
                  onCancelReservation={handleCancelReservation}
                  cancelReservationMutation={cancelReservationMutation}
                />
              </>
            ) : (
              <EmptyPanel title={emptyTitle} description={emptyDescription} />
            )}
          </div>

          <ResourcesActionsPanel
            locale={locale}
            selectedResource={selectedResource}
            resourceForm={resourceForm}
            setResourceForm={setResourceForm}
            resourceUnitForm={resourceUnitForm}
            setResourceUnitForm={setResourceUnitForm}
            bookingClosureForm={bookingClosureForm}
            setBookingClosureForm={setBookingClosureForm}
            releaseRuleForm={releaseRuleForm}
            setReleaseRuleForm={setReleaseRuleForm}
            lockedResourceType={lockedResourceType}
            resourceOperationTargetsCount={resourceOperationTargets.length}
            hasReleaseStrategy={hasReleaseStrategy}
            showSchedulingSettings={showSchedulingSettings}
            setShowAdvancedScheduling={setShowAdvancedScheduling}
            createResourceMutation={createResourceMutation}
            createResourceUnitMutation={createResourceUnitMutation}
            createBookingClosureMutation={createBookingClosureMutation}
            createReleaseRuleMutation={createReleaseRuleMutation}
            isCreateResourceValid={isCreateResourceValid}
            isCreateResourceUnitValid={isCreateResourceUnitValid}
            onCreateResource={handleCreateResource}
            onCreateResourceUnit={handleCreateResourceUnit}
            onCreateBookingClosure={handleCreateBookingClosure}
            onCreateReleaseRule={handleCreateReleaseRule}
          />
        </div>
      )}
    </PageSection>
  );
}
