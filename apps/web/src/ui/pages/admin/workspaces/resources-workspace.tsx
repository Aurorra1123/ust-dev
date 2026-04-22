import { useMemo, useState } from "react";
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
  getDomainResources,
  getLockedResourceType,
  type ActiveInlinePanel,
  type ResourceWorkspaceDomain,
} from "./resources/resources-workspace-selectors";
import { useResourceWorkspaceMutationActions } from "./resources/use-resource-workspace-mutation-actions";
import { useResourceWorkspaceMutations } from "./resources/use-resource-workspace-mutations";
import { useResourceWorkspacePanelActions } from "./resources/use-resource-workspace-panel-actions";
import { useResourceWorkspaceView } from "./resources/use-resource-workspace-view";

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

  const {
    academicAreaGroups,
    visibleResources,
    isCreatingResource,
    editingResourceId,
    creatingUnitResourceId,
    editingUnitTarget,
    isCreateResourceValid,
    isEditResourceValid,
    isCreateResourceUnitValid,
    isEditResourceUnitValid,
    workspaceCopy
  } = useResourceWorkspaceView({
    locale,
    domain,
    resources: domainResources,
    academicAreaKey,
    setAcademicAreaKey,
    activeInlinePanel,
    setActiveInlinePanel,
    resourceCreateForm,
    resourceEditForm,
    resourceUnitCreateForm,
    resourceUnitEditForm,
    setResourceCreateForm
  });

  const {
    handleOpenCreateResource,
    handleCancelCreateResource,
    handleOpenEditResource,
    handleCancelEditResource,
    handleOpenCreateResourceUnit,
    handleCancelCreateResourceUnit,
    handleOpenEditResourceUnit,
    handleCancelEditResourceUnit
  } = useResourceWorkspacePanelActions({
    visibleResources,
    lockedResourceType,
    setActiveInlinePanel,
    setResourceCreateForm,
    setResourceEditForm,
    setResourceUnitCreateForm,
    setResourceUnitEditForm,
    createResourceMutation,
    updateResourceMutation,
    createResourceUnitMutation,
    updateResourceUnitMutation
  });

  const {
    handleToggleResourceStatus,
    handleDeleteResource,
    handleDeleteResourceUnit,
    handleCreateResource,
    handleSaveResource,
    handleCreateResourceUnit,
    handleSaveResourceUnit
  } = useResourceWorkspaceMutationActions({
    locale,
    visibleResources,
    activeInlinePanel,
    lockedResourceType,
    resourceCreateForm,
    resourceEditForm,
    resourceUnitCreateForm,
    resourceUnitEditForm,
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
