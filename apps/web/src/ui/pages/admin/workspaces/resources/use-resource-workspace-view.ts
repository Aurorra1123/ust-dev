import { useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { Locale } from "../../../../../store/locale-store";
import type {
  ResourceFormState,
  ResourceUnitFormState
} from "./resources-workspace-helpers";
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
} from "./resources-workspace-selectors";

export function useResourceWorkspaceView({
  locale,
  domain,
  resources,
  academicAreaKey,
  setAcademicAreaKey,
  activeInlinePanel,
  setActiveInlinePanel,
  resourceCreateForm,
  resourceEditForm,
  resourceUnitCreateForm,
  resourceUnitEditForm,
  setResourceCreateForm
}: {
  locale: Locale;
  domain: ResourceWorkspaceDomain;
  resources: ReturnType<typeof getDomainResources>;
  academicAreaKey: string;
  setAcademicAreaKey: Dispatch<SetStateAction<string>>;
  activeInlinePanel: ActiveInlinePanel | null;
  setActiveInlinePanel: Dispatch<SetStateAction<ActiveInlinePanel | null>>;
  resourceCreateForm: ResourceFormState;
  resourceEditForm: ResourceFormState;
  resourceUnitCreateForm: ResourceUnitFormState;
  resourceUnitEditForm: ResourceUnitFormState;
  setResourceCreateForm: Dispatch<SetStateAction<ResourceFormState>>;
}) {
  const lockedResourceType = getLockedResourceType(domain);
  const academicAreaGroups = useMemo(
    () => getAcademicAreaGroups(domain, resources, locale),
    [domain, locale, resources]
  );
  const visibleResources = useMemo(
    () => getVisibleResources(domain, resources, academicAreaGroups, academicAreaKey),
    [academicAreaGroups, academicAreaKey, domain, resources]
  );
  const activeResource = useMemo(
    () => getActiveResource(visibleResources, activeInlinePanel),
    [activeInlinePanel, visibleResources]
  );
  const activeUnit = useMemo(
    () => getActiveUnit(activeResource, activeInlinePanel),
    [activeInlinePanel, activeResource]
  );

  useAcademicAreaSync(domain, academicAreaGroups, academicAreaKey, setAcademicAreaKey);
  useLockedResourceTypeSync(lockedResourceType, setResourceCreateForm);
  useActiveInlinePanelSync(activeInlinePanel, visibleResources, setActiveInlinePanel);

  return {
    lockedResourceType,
    academicAreaGroups,
    visibleResources,
    activeResource,
    activeUnit,
    isCreatingResource: activeInlinePanel?.kind === "createResource",
    editingResourceId:
      activeInlinePanel?.kind === "editResource" ? activeInlinePanel.resourceId : "",
    creatingUnitResourceId:
      activeInlinePanel?.kind === "createUnit" ? activeInlinePanel.resourceId : "",
    editingUnitTarget:
      activeInlinePanel?.kind === "editUnit"
        ? {
            resourceId: activeInlinePanel.resourceId,
            unitId: activeInlinePanel.unitId
          }
        : null,
    isCreateResourceValid: validateResourceForm(resourceCreateForm),
    isEditResourceValid:
      activeInlinePanel?.kind === "editResource" &&
      Boolean(activeResource) &&
      validateResourceForm(resourceEditForm),
    isCreateResourceUnitValid:
      activeInlinePanel?.kind === "createUnit" &&
      Boolean(activeResource) &&
      validateResourceUnitForm(resourceUnitCreateForm),
    isEditResourceUnitValid:
      activeInlinePanel?.kind === "editUnit" &&
      Boolean(activeResource && activeUnit) &&
      validateResourceUnitForm(resourceUnitEditForm),
    workspaceCopy: getWorkspaceCopy(domain, locale)
  };
}

function useAcademicAreaSync(
  domain: ResourceWorkspaceDomain,
  academicAreaGroups: ReturnType<typeof getAcademicAreaGroups>,
  academicAreaKey: string,
  setAcademicAreaKey: Dispatch<SetStateAction<string>>
) {
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
  }, [academicAreaGroups, academicAreaKey, domain, setAcademicAreaKey]);
}

function useLockedResourceTypeSync(
  lockedResourceType: ReturnType<typeof getLockedResourceType>,
  setResourceCreateForm: Dispatch<SetStateAction<ResourceFormState>>
) {
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
  }, [lockedResourceType, setResourceCreateForm]);
}

function useActiveInlinePanelSync(
  activeInlinePanel: ActiveInlinePanel | null,
  visibleResources: ReturnType<typeof getVisibleResources>,
  setActiveInlinePanel: Dispatch<SetStateAction<ActiveInlinePanel | null>>
) {
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
  }, [activeInlinePanel, setActiveInlinePanel, visibleResources]);
}
