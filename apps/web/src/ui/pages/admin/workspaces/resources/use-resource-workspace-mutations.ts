import { useMutation } from "@tanstack/react-query";
import type { ResourceType } from "@campusbook/shared-types";
import type { Dispatch, SetStateAction } from "react";

import {
  createResource,
  createResourceUnit,
  deleteResource,
  deleteResourceUnit,
  updateResource,
  updateResourceUnit
} from "../../../../../lib/api/resource-api";
import { queryClient } from "../../../../../lib/query-client";
import {
  alignResourceUnitFormToResource,
  createDefaultResourceFormState,
  createDefaultResourceUnitFormState,
  extractAcademicAreaKey,
  toResourceFormState,
  toResourceUnitFormState,
  type ResourceFormState,
  type ResourceUnitFormState
} from "./resources-workspace-helpers";
import {
  getPanelResourceId,
  type ActiveInlinePanel,
  type ResourceWorkspaceDomain
} from "./resources-workspace-selectors";

async function invalidateResourceQueries() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
    queryClient.invalidateQueries({ queryKey: ["resources"] })
  ]);
}

export function useResourceWorkspaceMutations({
  domain,
  lockedResourceType,
  setAcademicAreaKey,
  setResourceCreateForm,
  setResourceEditForm,
  setResourceUnitCreateForm,
  setResourceUnitEditForm,
  setActiveInlinePanel
}: {
  domain: ResourceWorkspaceDomain;
  lockedResourceType: ResourceType | null;
  setAcademicAreaKey: Dispatch<SetStateAction<string>>;
  setResourceCreateForm: Dispatch<SetStateAction<ResourceFormState>>;
  setResourceEditForm: Dispatch<SetStateAction<ResourceFormState>>;
  setResourceUnitCreateForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  setResourceUnitEditForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  setActiveInlinePanel: Dispatch<SetStateAction<ActiveInlinePanel | null>>;
}) {
  const createResourceMutation = useMutation({
    mutationFn: createResource,
    onSuccess: async (resource) => {
      if (domain === "academic") {
        setAcademicAreaKey(extractAcademicAreaKey(resource.code));
      }

      setResourceCreateForm(createDefaultResourceFormState(lockedResourceType ?? resource.type));
      await invalidateResourceQueries();
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
      await invalidateResourceQueries();
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
      await invalidateResourceQueries();
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
      const updatedUnit = resource.units.find((unit) => unit.id === variables.unitId) ?? null;

      if (updatedUnit) {
        setResourceUnitEditForm(toResourceUnitFormState(updatedUnit));
      }

      await invalidateResourceQueries();
    }
  });

  const updateResourceStatusMutation = useMutation({
    mutationFn: (payload: { resourceId: string; status: "active" | "inactive" }) =>
      updateResource(payload.resourceId, { status: payload.status }),
    onSuccess: async () => {
      await invalidateResourceQueries();
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (currentResourceId: string) => deleteResource(currentResourceId),
    onSuccess: async (_, deletedResourceId) => {
      setActiveInlinePanel((current) =>
        getPanelResourceId(current) === deletedResourceId ? null : current
      );
      await invalidateResourceQueries();
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
      await invalidateResourceQueries();
    }
  });

  return {
    createResourceMutation,
    updateResourceMutation,
    createResourceUnitMutation,
    updateResourceUnitMutation,
    updateResourceStatusMutation,
    deleteResourceMutation,
    deleteResourceUnitMutation
  };
}
