import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchAdminResources } from "../../../../lib/api/resource-api";
import { getErrorMessage } from "../../../../lib/http/errors";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { StatePanel } from "../../../user-experience-kit";
import { AcademicAreaTabs } from "./resources/academic-area-tabs";
import { ResourcesCatalogPanel } from "./resources/resources-catalog-panel";
import {
  createDefaultResourceFormState,
  createDefaultResourceUnitFormState,
} from "./resources/resources-workspace-helpers";
import {
  getAcademicAreaGroups,
  getActiveResource,
  getActiveUnit,
  getDomainResources,
  getLockedResourceType,
  getPanelResourceId,
  getVisibleResources,
  getWorkspaceCopy,
  type ActiveInlinePanel,
  type ResourceWorkspaceDomain,
  validateResourceForm,
  validateResourceUnitForm
} from "./resources/resources-workspace-selectors";
import { useResourceWorkspaceActions } from "./resources/use-resource-workspace-actions";
import { useResourceWorkspaceMutations } from "./resources/use-resource-workspace-mutations";

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
  const lockedResourceType = getLockedResourceType(domain);
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

  const domainResources = useMemo(
    () => getDomainResources(resourcesQuery.data, lockedResourceType),
    [lockedResourceType, resourcesQuery.data]
  );
  const academicAreaGroups = useMemo(
    () => getAcademicAreaGroups(domain, domainResources, locale),
    [domain, domainResources, locale]
  );
  const visibleResources = useMemo(
    () => getVisibleResources(domain, domainResources, academicAreaGroups, academicAreaKey),
    [academicAreaGroups, academicAreaKey, domain, domainResources]
  );
  const activeResource = useMemo(
    () => getActiveResource(visibleResources, activeInlinePanel),
    [activeInlinePanel, visibleResources]
  );
  const activeUnit = useMemo(
    () => getActiveUnit(activeResource, activeInlinePanel),
    [activeInlinePanel, activeResource]
  );
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

  const {
    createResourceMutation,
    updateResourceMutation,
    createResourceUnitMutation,
    updateResourceUnitMutation,
    updateResourceStatusMutation,
    deleteResourceMutation,
    deleteResourceUnitMutation
  } = useResourceWorkspaceMutations({
    domain,
    lockedResourceType,
    setAcademicAreaKey,
    setResourceCreateForm,
    setResourceEditForm,
    setResourceUnitCreateForm,
    setResourceUnitEditForm,
    setActiveInlinePanel
  });

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

  const isCreateResourceValid = validateResourceForm(resourceCreateForm);
  const isEditResourceValid =
    activeInlinePanel?.kind === "editResource" &&
    Boolean(activeResource) &&
    validateResourceForm(resourceEditForm);
  const isCreateResourceUnitValid =
    activeInlinePanel?.kind === "createUnit" &&
    Boolean(activeResource) &&
    validateResourceUnitForm(resourceUnitCreateForm);
  const isEditResourceUnitValid =
    activeInlinePanel?.kind === "editUnit" &&
    Boolean(activeResource && activeUnit) &&
    validateResourceUnitForm(resourceUnitEditForm);
  const workspaceCopy = getWorkspaceCopy(domain, locale);

  const {
    handleOpenCreateResource,
    handleCancelCreateResource,
    handleOpenEditResource,
    handleCancelEditResource,
    handleOpenCreateResourceUnit,
    handleCancelCreateResourceUnit,
    handleOpenEditResourceUnit,
    handleCancelEditResourceUnit,
    handleToggleResourceStatus,
    handleDeleteResource,
    handleDeleteResourceUnit,
    handleCreateResource,
    handleSaveResource,
    handleCreateResourceUnit,
    handleSaveResourceUnit
  } = useResourceWorkspaceActions({
    locale,
    visibleResources,
    activeInlinePanel,
    lockedResourceType,
    resourceCreateForm,
    resourceEditForm,
    resourceUnitCreateForm,
    resourceUnitEditForm,
    setActiveInlinePanel,
    setResourceCreateForm,
    setResourceEditForm,
    setResourceUnitCreateForm,
    setResourceUnitEditForm,
    setStatusFeedbackResourceId,
    setDeleteFeedbackResourceId,
    setDeleteUnitFeedbackResourceId,
    createResourceMutation,
    updateResourceMutation,
    createResourceUnitMutation,
    updateResourceUnitMutation,
    updateResourceStatusMutation,
    deleteResourceMutation,
    deleteResourceUnitMutation
  });

  return (
    <PageSection title={workspaceCopy.title} description={workspaceCopy.description}>
      {resourcesQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={workspaceCopy.loadingTitle}
          description={workspaceCopy.loadingDescription}
        />
      ) : resourcesQuery.isError ? (
        <StatePanel
          tone="danger"
          title={workspaceCopy.errorTitle}
          description={getErrorMessage(resourcesQuery.error)}
        />
      ) : (
        <div className="grid gap-4">
          {domain === "academic" ? (
            <AcademicAreaTabs
              locale={locale}
              groups={academicAreaGroups}
              activeKey={academicAreaKey}
              onSelect={setAcademicAreaKey}
            />
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
