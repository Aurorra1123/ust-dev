import type {
  AdminResourceDetailResponse,
  ResourceType
} from "@campusbook/shared-types";
import type { Dispatch, SetStateAction } from "react";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import type { CreateResourcePayload } from "../../../../../lib/api/resource-api";
import type {
  ResourceFormState,
  ResourceUnitFormState
} from "./resources-workspace-helpers";
import type { ActiveInlinePanel } from "./resources-workspace-selectors";

type CreateResourceMutationLike = {
  mutate: (payload: CreateResourcePayload) => void;
};

type UpdateResourceMutationLike = {
  mutate: (payload: {
    resourceId: string;
    body: {
      type: ResourceType;
      code: string;
      name: string;
      description?: string;
      location?: string;
    };
  }) => void;
};

type CreateResourceUnitMutationLike = {
  reset: () => void;
  mutate: (payload: {
    resourceId: string;
    code: string;
    name: string;
    unitType: string;
    availabilityMode: "continuous" | "discrete_slot";
    capacity: number;
  }) => void;
};

type UpdateResourceUnitMutationLike = {
  reset: () => void;
  mutate: (payload: {
    resourceId: string;
    unitId: string;
    body: {
      code: string;
      name: string;
      unitType: string;
      availabilityMode: "continuous" | "discrete_slot";
      capacity: number;
    };
  }) => void;
};

type UpdateResourceStatusMutationLike = {
  reset: () => void;
  mutate: (payload: { resourceId: string; status: "active" | "inactive" }) => void;
};

type DeleteResourceMutationLike = {
  reset: () => void;
  mutate: (resourceId: string) => void;
};

type DeleteResourceUnitMutationLike = {
  reset: () => void;
  mutate: (payload: { resourceId: string; unitId: string }) => void;
};

export function useResourceWorkspaceMutationActions({
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
}: {
  locale: Locale;
  visibleResources: AdminResourceDetailResponse[];
  activeInlinePanel: ActiveInlinePanel | null;
  lockedResourceType: ResourceType | null;
  resourceCreateForm: ResourceFormState;
  resourceEditForm: ResourceFormState;
  resourceUnitCreateForm: ResourceUnitFormState;
  resourceUnitEditForm: ResourceUnitFormState;
  setStatusFeedbackResourceId: Dispatch<SetStateAction<string>>;
  setDeleteFeedbackResourceId: Dispatch<SetStateAction<string>>;
  setDeleteUnitFeedbackResourceId: Dispatch<SetStateAction<string>>;
  createResourceMutation: CreateResourceMutationLike;
  updateResourceMutation: UpdateResourceMutationLike;
  createResourceUnitMutation: CreateResourceUnitMutationLike;
  updateResourceUnitMutation: UpdateResourceUnitMutationLike;
  updateResourceStatusMutation: UpdateResourceStatusMutationLike;
  deleteResourceMutation: DeleteResourceMutationLike;
  deleteResourceUnitMutation: DeleteResourceUnitMutationLike;
}) {
  const findResource = (resourceId: string) =>
    visibleResources.find((resource) => resource.id === resourceId) ?? null;

  function handleToggleResourceStatus(resourceId: string) {
    const resource = findResource(resourceId);

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
    const resource = findResource(resourceId);

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
    const resource = findResource(resourceId);

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
      resourceId,
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

  return {
    handleToggleResourceStatus,
    handleDeleteResource,
    handleDeleteResourceUnit,
    handleCreateResource,
    handleSaveResource,
    handleCreateResourceUnit,
    handleSaveResourceUnit
  };
}
