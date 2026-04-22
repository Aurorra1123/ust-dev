import type {
  AdminResourceDetailResponse,
  ResourceType
} from "@campusbook/shared-types";
import type { Dispatch, SetStateAction } from "react";

import {
  alignResourceUnitFormToResource,
  createDefaultResourceFormState,
  createDefaultResourceUnitFormState,
  toResourceFormState,
  toResourceUnitFormState,
  type ResourceFormState,
  type ResourceUnitFormState
} from "./resources-workspace-helpers";
import type { ActiveInlinePanel } from "./resources-workspace-selectors";

type ResettableMutation = {
  reset: () => void;
};

export function useResourceWorkspacePanelActions({
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
}: {
  visibleResources: AdminResourceDetailResponse[];
  lockedResourceType: ResourceType | null;
  setActiveInlinePanel: Dispatch<SetStateAction<ActiveInlinePanel | null>>;
  setResourceCreateForm: Dispatch<SetStateAction<ResourceFormState>>;
  setResourceEditForm: Dispatch<SetStateAction<ResourceFormState>>;
  setResourceUnitCreateForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  setResourceUnitEditForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  createResourceMutation: ResettableMutation;
  updateResourceMutation: ResettableMutation;
  createResourceUnitMutation: ResettableMutation;
  updateResourceUnitMutation: ResettableMutation;
}) {
  const findResource = (resourceId: string) =>
    visibleResources.find((resource) => resource.id === resourceId) ?? null;

  const findUnit = (resourceId: string, unitId: string) =>
    findResource(resourceId)?.units.find((unit) => unit.id === unitId) ?? null;

  function handleOpenCreateResource() {
    createResourceMutation.reset();
    setResourceCreateForm(createDefaultResourceFormState(lockedResourceType ?? "academic_space"));
    setActiveInlinePanel({ kind: "createResource" });
  }

  function handleCancelCreateResource() {
    createResourceMutation.reset();
    setResourceCreateForm(createDefaultResourceFormState(lockedResourceType ?? "academic_space"));
    setActiveInlinePanel((current) => (current?.kind === "createResource" ? null : current));
  }

  function handleOpenEditResource(resourceId: string) {
    const resource = findResource(resourceId);

    if (!resource) {
      return;
    }

    updateResourceMutation.reset();
    setResourceEditForm(toResourceFormState(resource));
    setActiveInlinePanel({ kind: "editResource", resourceId });
  }

  function handleCancelEditResource(resourceId: string) {
    const resource = findResource(resourceId);

    if (resource) {
      setResourceEditForm(toResourceFormState(resource));
    }

    updateResourceMutation.reset();
    setActiveInlinePanel((current) =>
      current?.kind === "editResource" && current.resourceId === resourceId ? null : current
    );
  }

  function handleOpenCreateResourceUnit(resourceId: string) {
    const resource = findResource(resourceId);

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
    const resource = findResource(resourceId);

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
    const unit = findUnit(resourceId, unitId);

    if (!unit) {
      return;
    }

    updateResourceUnitMutation.reset();
    setResourceUnitEditForm(toResourceUnitFormState(unit));
    setActiveInlinePanel({ kind: "editUnit", resourceId, unitId });
  }

  function handleCancelEditResourceUnit(resourceId: string, unitId: string) {
    const unit = findUnit(resourceId, unitId);

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

  return {
    handleOpenCreateResource,
    handleCancelCreateResource,
    handleOpenEditResource,
    handleCancelEditResource,
    handleOpenCreateResourceUnit,
    handleCancelCreateResourceUnit,
    handleOpenEditResourceUnit,
    handleCancelEditResourceUnit
  };
}
