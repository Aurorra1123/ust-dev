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
import { EmptyPanel, StatePanel } from "../../../user-experience-kit";
import { ResourcesActionsPanel } from "./resources/resources-actions-panel";
import { ResourcesCatalogPanel } from "./resources/resources-catalog-panel";
import { ResourcesDetailPanel } from "./resources/resources-detail-panel";
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
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [academicAreaKey, setAcademicAreaKey] = useState("");
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

    setResourceCreateForm((current) =>
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
  const selectedUnit =
    selectedResource?.units.find((unit) => unit.id === selectedUnitId) ??
    selectedResource?.units[0] ??
    null;
  const isCreateResourceValid =
    resourceCreateForm.code.trim().length > 0 &&
    resourceCreateForm.name.trim().length > 0;
  const isEditResourceValid =
    Boolean(selectedResource) &&
    resourceEditForm.code.trim().length > 0 &&
    resourceEditForm.name.trim().length > 0;
  const isCreateResourceUnitValid =
    Boolean(selectedResource) &&
    resourceUnitCreateForm.code.trim().length > 0 &&
    resourceUnitCreateForm.name.trim().length > 0 &&
    resourceUnitCreateForm.unitType.trim().length > 0 &&
    resourceUnitCreateForm.capacity > 0;
  const isEditResourceUnitValid =
    Boolean(selectedResource && selectedUnit) &&
    resourceUnitEditForm.code.trim().length > 0 &&
    resourceUnitEditForm.name.trim().length > 0 &&
    resourceUnitEditForm.unitType.trim().length > 0 &&
    resourceUnitEditForm.capacity > 0;

  useEffect(() => {
    if (!selectedResource) {
      setSelectedUnitId("");
      return;
    }

    if (!selectedResource.units.some((unit) => unit.id === selectedUnitId)) {
      setSelectedUnitId(selectedResource.units[0]?.id ?? "");
    }
  }, [selectedResource, selectedUnitId]);

  useEffect(() => {
    if (!selectedResource) {
      return;
    }

    setResourceUnitCreateForm((current) =>
      alignResourceUnitFormToResource(current, selectedResource)
    );
    setResourceEditForm(toResourceFormState(selectedResource));
  }, [selectedResource]);

  useEffect(() => {
    if (!selectedUnit) {
      return;
    }

    setResourceUnitEditForm(toResourceUnitFormState(selectedUnit));
  }, [selectedUnit]);

  const createResourceMutation = useMutation({
    mutationFn: createResource,
    onSuccess: async (resource) => {
      if (domain === "academic") {
        setAcademicAreaKey(extractAcademicAreaKey(resource.code));
      }

      setResourceId(resource.id);
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

      setResourceId(resource.id);
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
    onSuccess: async (resource, variables) => {
      setResourceId(resource.id);
      setSelectedUnitId(
        resource.units.find((unit) => unit.code === variables.code)?.id ?? ""
      );
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
      setResourceId(resource.id);
      setSelectedUnitId(variables.unitId);
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
    onSuccess: async (resource) => {
      setResourceId(resource.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (currentResourceId: string) => deleteResource(currentResourceId),
    onSuccess: async () => {
      setResourceId("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
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
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

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
          "仅当该资源没有资源单元、规则绑定和历史预约记录时，才允许彻底删除。确认继续吗？",
          "The resource can only be deleted when it has no units, rule bindings, or reservation history. Continue?"
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
      ...resourceCreateForm,
      type: lockedResourceType ?? resourceCreateForm.type
    });
  }

  function handleSaveResource() {
    if (!selectedResource) {
      return;
    }

    updateResourceMutation.mutate({
      resourceId: selectedResource.id,
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
    if (!selectedResource) {
      return;
    }

    createResourceUnitMutation.mutate({
      resourceId: selectedResource.id,
      code: resourceUnitCreateForm.code.trim(),
      name: resourceUnitCreateForm.name.trim(),
      unitType: resourceUnitCreateForm.unitType.trim(),
      availabilityMode: resourceUnitCreateForm.availabilityMode,
      capacity: resourceUnitCreateForm.capacity
    });
  }

  function handleSaveResourceUnit() {
    if (!selectedResource || !selectedUnit) {
      return;
    }

    updateResourceUnitMutation.mutate({
      resourceId: selectedResource.id,
      unitId: selectedUnit.id,
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
          "这里专门维护体育场馆与场地单元，不再混入规则、调度和预约状态控制。",
          "Maintain sports venues and court units here without mixing in rule, scheduling, or reservation controls."
        )
      : domain === "academic"
        ? localeText(
            locale,
            "这里专门维护学术空间与房间单元。你可以先按 E1/E2/E3/E4 等区域查看，再管理对应空间。",
            "Maintain academic spaces and room units here. Review spaces by E1/E2/E3/E4-style areas first, then manage the matching rooms."
          )
        : localeText(
            locale,
            "这里专门处理资源和资源单元的基础维护，不再承担规则、调度和预约状态控制。",
            "This workspace now focuses only on resource and unit maintenance instead of rule, scheduling, and reservation controls."
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
          "可以先在右侧创建体育场馆，再补具体场地单元。",
          "Create a sports venue on the right first, then add specific court units."
        )
      : domain === "academic"
        ? localeText(
            locale,
            "可以先在右侧创建学术空间。命名规范符合 E1/E2/E3/E4 等前缀时，会自动进入对应区域。",
            "Create an academic space on the right first. Codes that start with E1/E2/E3/E4 and similar prefixes will be grouped into the matching area automatically."
          )
        : localeText(locale, "可以先在右侧创建资源。", "Create a resource on the right first.");

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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),380px]">
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
                  selectedResource={selectedResource}
                  selectedUnitId={selectedUnitId}
                  onSelectUnit={setSelectedUnitId}
                  onToggleResourceStatus={handleToggleResourceStatus}
                  onDeleteResource={handleDeleteResource}
                  onDeleteResourceUnit={handleDeleteResourceUnit}
                  updateResourceStatusMutation={updateResourceStatusMutation}
                  deleteResourceMutation={deleteResourceMutation}
                  deleteResourceUnitMutation={deleteResourceUnitMutation}
                />
              </>
            ) : (
              <EmptyPanel title={emptyTitle} description={emptyDescription} />
            )}
          </div>

          <ResourcesActionsPanel
            locale={locale}
            selectedResource={selectedResource}
            selectedUnit={selectedUnit}
            resourceCreateForm={resourceCreateForm}
            setResourceCreateForm={setResourceCreateForm}
            resourceEditForm={resourceEditForm}
            setResourceEditForm={setResourceEditForm}
            resourceUnitCreateForm={resourceUnitCreateForm}
            setResourceUnitCreateForm={setResourceUnitCreateForm}
            resourceUnitEditForm={resourceUnitEditForm}
            setResourceUnitEditForm={setResourceUnitEditForm}
            lockedResourceType={lockedResourceType}
            createResourceMutation={createResourceMutation}
            updateResourceMutation={updateResourceMutation}
            createResourceUnitMutation={createResourceUnitMutation}
            updateResourceUnitMutation={updateResourceUnitMutation}
            isCreateResourceValid={isCreateResourceValid}
            isEditResourceValid={isEditResourceValid}
            isCreateResourceUnitValid={isCreateResourceUnitValid}
            isEditResourceUnitValid={isEditResourceUnitValid}
            onCreateResource={handleCreateResource}
            onSaveResource={handleSaveResource}
            onCreateResourceUnit={handleCreateResourceUnit}
            onSaveResourceUnit={handleSaveResourceUnit}
          />
        </div>
      )}
    </PageSection>
  );
}
