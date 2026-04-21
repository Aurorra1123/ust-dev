import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { cancelOrder } from "../../../../lib/api/order-api";
import {
  createResource,
  createResourceBookingClosures,
  createResourceReleaseRules,
  createResourceUnit,
  deleteResource,
  deleteResourceUnit,
  fetchAdminResourceReservationStatus,
  fetchAdminResources,
  updateResource
} from "../../../../lib/api/resource-api";
import { localeText } from "../../../../lib/locale";
import { queryClient } from "../../../../lib/query-client";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { StatePanel } from "../../../user-experience-kit";
import { ResourcesActionsPanel } from "./resources/resources-actions-panel";
import { ResourcesCatalogPanel } from "./resources/resources-catalog-panel";
import { ResourcesDetailPanel } from "./resources/resources-detail-panel";
import {
  alignResourceUnitFormToResource,
  createDefaultBookingClosureFormState,
  createDefaultReleaseRuleFormState,
  createDefaultResourceFormState,
  createDefaultResourceUnitFormState,
  createDefaultStatusWindow,
  type StatusWindowState
} from "./resources/resources-workspace-helpers";

export function ResourcesWorkspace({ locale }: { locale: Locale }) {
  const resourcesQuery = useQuery({
    queryKey: ["admin", "resources"],
    queryFn: fetchAdminResources
  });
  const [resourceId, setResourceId] = useState("");
  const [resourceForm, setResourceForm] = useState(createDefaultResourceFormState);
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

  useEffect(() => {
    const firstResource = resourcesQuery.data?.[0];

    if (!resourceId && firstResource) {
      setResourceId(firstResource.id);
    }
  }, [resourceId, resourcesQuery.data]);

  const selectedResource =
    resourcesQuery.data?.find((resource) => resource.id === resourceId) ??
    resourcesQuery.data?.[0] ??
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
    createResourceMutation.mutate(resourceForm);
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

  return (
    <PageSection
      title={localeText(locale, "资源工作区", "Resource Workspace")}
      description={localeText(
        locale,
        "这里集中处理资源列表、预约开放策略、预约通道关闭和预约状态查看。左侧先选资源，中间看当前状态，右侧执行新增和配置操作。",
        "This workspace manages the resource list, booking opening strategy, booking closures, and reservation status. Select a resource on the left, review its current status in the center, and configure updates on the right."
      )}
    >
      {resourcesQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入资源工作区", "Loading resource workspace")}
          description={localeText(
            locale,
            "页面正在整理当前可维护的资源、开放策略和预约状态。",
            "The page is loading current resources, opening strategies, and reservation status."
          )}
        />
      ) : resourcesQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "资源工作区暂时无法加载", "Resource workspace is unavailable")}
          description={(resourcesQuery.error as Error).message}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),340px]">
          <div className="grid gap-4">
            <ResourcesCatalogPanel
              locale={locale}
              resources={resourcesQuery.data ?? []}
              selectedResourceId={selectedResource?.id ?? null}
              onSelectResource={setResourceId}
            />
            <ResourcesDetailPanel
              locale={locale}
              resources={resourcesQuery.data ?? []}
              selectedResource={selectedResource}
              resourceOperationTargets={resourceOperationTargets}
              onToggleResourceOperationTarget={handleToggleResourceOperationTarget}
              onToggleResourceStatus={handleToggleResourceStatus}
              onDeleteResource={handleDeleteResource}
              onDeleteResourceUnit={handleDeleteResourceUnit}
              updateResourceStatusMutation={updateResourceStatusMutation}
              deleteResourceMutation={deleteResourceMutation}
              deleteResourceUnitMutation={deleteResourceUnitMutation}
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
