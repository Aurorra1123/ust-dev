import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ResourceType } from "@campusbook/shared-types";

import {
  createResource,
  createResourceUnit,
  deleteResource,
  deleteResourceUnit,
  fetchAdminResources,
  updateResource,
  updateResourceUnit
} from "../../../../lib/api/resource-api";
import { getErrorMessage } from "../../../../lib/http/errors";
import { localeText } from "../../../../lib/locale";
import { queryClient } from "../../../../lib/query-client";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { StatePanel } from "../../../user-experience-kit";
import { ResourcesCatalogPanel } from "./resources/resources-catalog-panel";
import {
  alignResourceUnitFormToResource,
  buildAcademicAreaGroups,
  createDefaultResourceFormState,
  createDefaultResourceUnitFormState,
  extractAcademicAreaKey,
  toResourceFormState,
  toResourceUnitFormState
} from "./resources/resources-workspace-helpers";

type ResourceWorkspaceDomain = "all" | "sports" | "academic";
type ActiveInlinePanel =
  | { kind: "createResource" }
  | { kind: "editResource"; resourceId: string }
  | { kind: "createUnit"; resourceId: string }
  | { kind: "editUnit"; resourceId: string; unitId: string };

function getPanelResourceId(panel: ActiveInlinePanel | null) {
  if (!panel || panel.kind === "createResource") {
    return null;
  }

  return panel.resourceId;
}

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
  const [academicAreaKey, setAcademicAreaKey] = useState("");
  const [activeInlinePanel, setActiveInlinePanel] = useState<ActiveInlinePanel | null>(
    null
  );
  const [resourceCreateForm, setResourceCreateForm] = useState(() =>
    createDefaultResourceFormState(lockedResourceType ?? "academic_space")
  );
  const [resourceEditForm, setResourceEditForm] = useState(() =>
    createDefaultResourceFormState(lockedResourceType ?? "academic_space")
  );
  const [resourceUnitCreateForm, setResourceUnitCreateForm] = useState(
    createDefaultResourceUnitFormState
  );
  const [resourceUnitEditForm, setResourceUnitEditForm] = useState(
    createDefaultResourceUnitFormState
  );
  const [statusFeedbackResourceId, setStatusFeedbackResourceId] = useState("");
  const [deleteFeedbackResourceId, setDeleteFeedbackResourceId] = useState("");
  const [deleteUnitFeedbackResourceId, setDeleteUnitFeedbackResourceId] = useState("");

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
  const activeResourceId = getPanelResourceId(activeInlinePanel);
  const activeResource =
    visibleResources.find((resource) => resource.id === activeResourceId) ?? null;
  const activeUnit =
    activeInlinePanel?.kind === "editUnit"
      ? activeResource?.units.find((unit) => unit.id === activeInlinePanel.unitId) ?? null
      : null;
  const isCreatingResource = activeInlinePanel?.kind === "createResource";
  const editingResourceId =
    activeInlinePanel?.kind === "editResource" ? activeInlinePanel.resourceId : "";
  const creatingUnitResourceId =
    activeInlinePanel?.kind === "createUnit" ? activeInlinePanel.resourceId : "";
  const editingUnitTarget =
    activeInlinePanel?.kind === "editUnit"
      ? {
          resourceId: activeInlinePanel.resourceId,
          unitId: activeInlinePanel.unitId
        }
      : null;

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
    if (!lockedResourceType) {
      return;
    }

    setResourceCreateForm((current) =>
      current.type === lockedResourceType
        ? current
        : {
            ...current,
            type: lockedResourceType
          }
    );
  }, [lockedResourceType]);

  useEffect(() => {
    const panelResourceId = getPanelResourceId(activeInlinePanel);

    if (!panelResourceId) {
      return;
    }

    const resource = visibleResources.find((item) => item.id === panelResourceId);

    if (!resource) {
      setActiveInlinePanel(null);
      return;
    }

    if (
      activeInlinePanel?.kind === "editUnit" &&
      !resource.units.some((unit) => unit.id === activeInlinePanel.unitId)
    ) {
      setActiveInlinePanel(null);
    }
  }, [activeInlinePanel, visibleResources]);

  const isCreateResourceValid =
    resourceCreateForm.code.trim().length > 0 &&
    resourceCreateForm.name.trim().length > 0;
  const isEditResourceValid =
    activeInlinePanel?.kind === "editResource" &&
    Boolean(activeResource) &&
    resourceEditForm.code.trim().length > 0 &&
    resourceEditForm.name.trim().length > 0;
  const isCreateResourceUnitValid =
    activeInlinePanel?.kind === "createUnit" &&
    Boolean(activeResource) &&
    resourceUnitCreateForm.code.trim().length > 0 &&
    resourceUnitCreateForm.name.trim().length > 0 &&
    resourceUnitCreateForm.unitType.trim().length > 0 &&
    resourceUnitCreateForm.capacity > 0;
  const isEditResourceUnitValid =
    activeInlinePanel?.kind === "editUnit" &&
    Boolean(activeResource && activeUnit) &&
    resourceUnitEditForm.code.trim().length > 0 &&
    resourceUnitEditForm.name.trim().length > 0 &&
    resourceUnitEditForm.unitType.trim().length > 0 &&
    resourceUnitEditForm.capacity > 0;

  const createResourceMutation = useMutation({
    mutationFn: createResource,
    onSuccess: async (resource) => {
      if (domain === "academic") {
        setAcademicAreaKey(extractAcademicAreaKey(resource.code));
      }

      setResourceCreateForm(createDefaultResourceFormState(lockedResourceType ?? resource.type));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const updateResourceMutation = useMutation({
    mutationFn: (payload: {
      resourceId: string;
      body: {
        type: ResourceType;
        code: string;
        name: string;
        description?: string;
        location?: string;
      };
    }) => updateResource(payload.resourceId, payload.body),
    onSuccess: async (resource) => {
      if (domain === "academic") {
        setAcademicAreaKey(extractAcademicAreaKey(resource.code));
      }

      setResourceEditForm(toResourceFormState(resource));
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
    onSuccess: async (resource) => {
      setResourceUnitCreateForm(
        alignResourceUnitFormToResource(createDefaultResourceUnitFormState(), resource)
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const updateResourceUnitMutation = useMutation({
    mutationFn: (payload: {
      resourceId: string;
      unitId: string;
      body: {
        code: string;
        name: string;
        unitType: string;
        availabilityMode: "continuous" | "discrete_slot";
        capacity: number;
      };
    }) => updateResourceUnit(payload.resourceId, payload.unitId, payload.body),
    onSuccess: async (resource, variables) => {
      const updatedUnit =
        resource.units.find((unit) => unit.id === variables.unitId) ?? null;

      if (updatedUnit) {
        setResourceUnitEditForm(toResourceUnitFormState(updatedUnit));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const updateResourceStatusMutation = useMutation({
    mutationFn: (payload: { resourceId: string; status: "active" | "inactive" }) =>
      updateResource(payload.resourceId, { status: payload.status }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (currentResourceId: string) => deleteResource(currentResourceId),
    onSuccess: async (_, deletedResourceId) => {
      setActiveInlinePanel((current) =>
        getPanelResourceId(current) === deletedResourceId ? null : current
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const deleteResourceUnitMutation = useMutation({
    mutationFn: (payload: { resourceId: string; unitId: string }) =>
      deleteResourceUnit(payload.resourceId, payload.unitId),
    onSuccess: async (_, variables) => {
      setActiveInlinePanel((current) => {
        if (
          current?.kind === "editUnit" &&
          current.resourceId === variables.resourceId &&
          current.unitId === variables.unitId
        ) {
          return null;
        }

        return current;
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  function handleOpenCreateResource() {
    createResourceMutation.reset();
    setResourceCreateForm(createDefaultResourceFormState(lockedResourceType ?? "academic_space"));
    setActiveInlinePanel({ kind: "createResource" });
  }

  function handleCancelCreateResource() {
    createResourceMutation.reset();
    setResourceCreateForm(createDefaultResourceFormState(lockedResourceType ?? "academic_space"));
    setActiveInlinePanel((current) =>
      current?.kind === "createResource" ? null : current
    );
  }

  function handleOpenEditResource(resourceId: string) {
    const resource = visibleResources.find((item) => item.id === resourceId);

    if (!resource) {
      return;
    }

    updateResourceMutation.reset();
    setResourceEditForm(toResourceFormState(resource));
    setActiveInlinePanel({ kind: "editResource", resourceId });
  }

  function handleCancelEditResource(resourceId: string) {
    const resource = visibleResources.find((item) => item.id === resourceId);

    if (resource) {
      setResourceEditForm(toResourceFormState(resource));
    }

    updateResourceMutation.reset();
    setActiveInlinePanel((current) =>
      current?.kind === "editResource" && current.resourceId === resourceId ? null : current
    );
  }

  function handleOpenCreateResourceUnit(resourceId: string) {
    const resource = visibleResources.find((item) => item.id === resourceId);

    if (!resource) {
      return;
    }

    createResourceUnitMutation.reset();
    setResourceUnitCreateForm(
      alignResourceUnitFormToResource(createDefaultResourceUnitFormState(), resource)
    );
    setActiveInlinePanel({ kind: "createUnit", resourceId });
  }

  function handleCancelCreateResourceUnit(resourceId: string) {
    const resource = visibleResources.find((item) => item.id === resourceId);

    if (resource) {
      setResourceUnitCreateForm(
        alignResourceUnitFormToResource(createDefaultResourceUnitFormState(), resource)
      );
    }

    createResourceUnitMutation.reset();
    setActiveInlinePanel((current) =>
      current?.kind === "createUnit" && current.resourceId === resourceId ? null : current
    );
  }

  function handleOpenEditResourceUnit(resourceId: string, unitId: string) {
    const resource = visibleResources.find((item) => item.id === resourceId);
    const unit = resource?.units.find((item) => item.id === unitId);

    if (!resource || !unit) {
      return;
    }

    updateResourceUnitMutation.reset();
    setResourceUnitEditForm(toResourceUnitFormState(unit));
    setActiveInlinePanel({ kind: "editUnit", resourceId, unitId });
  }

  function handleCancelEditResourceUnit(resourceId: string, unitId: string) {
    const resource = visibleResources.find((item) => item.id === resourceId);
    const unit = resource?.units.find((item) => item.id === unitId);

    if (unit) {
      setResourceUnitEditForm(toResourceUnitFormState(unit));
    }

    updateResourceUnitMutation.reset();
    setActiveInlinePanel((current) =>
      current?.kind === "editUnit" &&
      current.resourceId === resourceId &&
      current.unitId === unitId
        ? null
        : current
    );
  }

  function handleToggleResourceStatus(resourceId: string) {
    const resource = visibleResources.find((item) => item.id === resourceId);

    if (!resource) {
      return;
    }

    const nextStatus = resource.status === "active" ? "inactive" : "active";

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

    updateResourceStatusMutation.reset();
    setStatusFeedbackResourceId(resource.id);
    updateResourceStatusMutation.mutate({
      resourceId: resource.id,
      status: nextStatus
    });
  }

  function handleDeleteResource(resourceId: string) {
    const resource = visibleResources.find((item) => item.id === resourceId);

    if (!resource) {
      return;
    }

    if (
      !window.confirm(
        localeText(
          locale,
          "仅当该资源没有资源单元、规则绑定和历史预约记录时，才允许彻底删除。确认继续吗？",
          "The resource can only be deleted when it has no units, rule bindings, or reservation history. Continue?"
        )
      )
    ) {
      return;
    }

    deleteResourceMutation.reset();
    setDeleteFeedbackResourceId(resource.id);
    deleteResourceMutation.mutate(resource.id);
  }

  function handleDeleteResourceUnit(resourceId: string, unitId: string) {
    const resource = visibleResources.find((item) => item.id === resourceId);

    if (!resource) {
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

    deleteResourceUnitMutation.reset();
    setDeleteUnitFeedbackResourceId(resource.id);
    deleteResourceUnitMutation.mutate({
      resourceId: resource.id,
      unitId
    });
  }

  function handleCreateResource() {
    createResourceMutation.mutate({
      ...resourceCreateForm,
      type: lockedResourceType ?? resourceCreateForm.type
    });
  }

  function handleSaveResource() {
    if (activeInlinePanel?.kind !== "editResource") {
      return;
    }

    updateResourceMutation.mutate({
      resourceId: activeInlinePanel.resourceId,
      body: {
        type: lockedResourceType ?? resourceEditForm.type,
        code: resourceEditForm.code.trim(),
        name: resourceEditForm.name.trim(),
        description: resourceEditForm.description.trim() || undefined,
        location: resourceEditForm.location.trim() || undefined
      }
    });
  }

  function handleCreateResourceUnit() {
    if (activeInlinePanel?.kind !== "createUnit") {
      return;
    }

    createResourceUnitMutation.mutate({
      resourceId: activeInlinePanel.resourceId,
      code: resourceUnitCreateForm.code.trim(),
      name: resourceUnitCreateForm.name.trim(),
      unitType: resourceUnitCreateForm.unitType.trim(),
      availabilityMode: resourceUnitCreateForm.availabilityMode,
      capacity: resourceUnitCreateForm.capacity
    });
  }

  function handleSaveResourceUnit() {
    if (activeInlinePanel?.kind !== "editUnit") {
      return;
    }

    updateResourceUnitMutation.mutate({
      resourceId: activeInlinePanel.resourceId,
      unitId: activeInlinePanel.unitId,
      body: {
        code: resourceUnitEditForm.code.trim(),
        name: resourceUnitEditForm.name.trim(),
        unitType: resourceUnitEditForm.unitType.trim(),
        availabilityMode: resourceUnitEditForm.availabilityMode,
        capacity: resourceUnitEditForm.capacity
      }
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
          "这里专门维护体育场馆与场地单元。已创建对象直接在原卡片内编辑，新增入口收口为虚线框。",
          "Maintain sports venues and court units here. Existing records are edited in place, while creation stays behind dashed entry cards."
        )
      : domain === "academic"
        ? localeText(
            locale,
            "这里专门维护学术空间与房间单元。你可以先按 E1/E2/E3/E4 等区域查看，再在对应卡片内直接维护。",
            "Maintain academic spaces and room units here. Review spaces by E1/E2/E3/E4-style areas first, then edit the matching cards in place."
          )
        : localeText(
            locale,
            "这里专门处理资源和资源单元的基础维护，已创建对象直接就地编辑，新增操作收口为虚线入口。",
            "This workspace now focuses only on resource and unit maintenance, with inline editing for existing records and dashed entry points for creation."
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
          "页面正在整理当前可维护的体育场馆与场地单元。",
          "The page is loading sports venues and court units."
        )
      : domain === "academic"
        ? localeText(
            locale,
            "页面正在整理当前可维护的学术空间、区域分组和房间单元。",
            "The page is loading academic spaces, area groups, and room units."
          )
        : localeText(
            locale,
            "页面正在整理当前可维护的资源与资源单元。",
            "The page is loading resources and resource units."
          );
  const errorTitle =
    domain === "sports"
      ? localeText(locale, "体育场馆暂时无法加载", "Sports venues are unavailable")
      : domain === "academic"
        ? localeText(locale, "学术空间暂时无法加载", "Academic spaces are unavailable")
        : localeText(locale, "资源工作区暂时无法加载", "Resource workspace is unavailable");

  return (
    <PageSection title={workspaceTitle} description={workspaceDescription}>
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

          <ResourcesCatalogPanel
            locale={locale}
            resources={visibleResources}
            lockedResourceType={lockedResourceType}
            isCreatingResource={Boolean(isCreatingResource)}
            editingResourceId={editingResourceId}
            creatingUnitResourceId={creatingUnitResourceId}
            editingUnitTarget={editingUnitTarget}
            resourceCreateForm={resourceCreateForm}
            setResourceCreateForm={setResourceCreateForm}
            resourceEditForm={resourceEditForm}
            setResourceEditForm={setResourceEditForm}
            resourceUnitCreateForm={resourceUnitCreateForm}
            setResourceUnitCreateForm={setResourceUnitCreateForm}
            resourceUnitEditForm={resourceUnitEditForm}
            setResourceUnitEditForm={setResourceUnitEditForm}
            createResourceMutation={createResourceMutation}
            updateResourceMutation={updateResourceMutation}
            createResourceUnitMutation={createResourceUnitMutation}
            updateResourceUnitMutation={updateResourceUnitMutation}
            updateResourceStatusMutation={updateResourceStatusMutation}
            deleteResourceMutation={deleteResourceMutation}
            deleteResourceUnitMutation={deleteResourceUnitMutation}
            statusFeedbackResourceId={statusFeedbackResourceId}
            deleteFeedbackResourceId={deleteFeedbackResourceId}
            deleteUnitFeedbackResourceId={deleteUnitFeedbackResourceId}
            isCreateResourceValid={isCreateResourceValid}
            isEditResourceValid={isEditResourceValid}
            isCreateResourceUnitValid={isCreateResourceUnitValid}
            isEditResourceUnitValid={isEditResourceUnitValid}
            onStartCreateResource={handleOpenCreateResource}
            onCancelCreateResource={handleCancelCreateResource}
            onCreateResource={handleCreateResource}
            onStartEditResource={handleOpenEditResource}
            onCancelEditResource={handleCancelEditResource}
            onSaveResource={handleSaveResource}
            onStartCreateResourceUnit={handleOpenCreateResourceUnit}
            onCancelCreateResourceUnit={handleCancelCreateResourceUnit}
            onCreateResourceUnit={handleCreateResourceUnit}
            onStartEditResourceUnit={handleOpenEditResourceUnit}
            onCancelEditResourceUnit={handleCancelEditResourceUnit}
            onSaveResourceUnit={handleSaveResourceUnit}
            onToggleResourceStatus={handleToggleResourceStatus}
            onDeleteResource={handleDeleteResource}
            onDeleteResourceUnit={handleDeleteResourceUnit}
          />
        </div>
      )}
    </PageSection>
  );
}
