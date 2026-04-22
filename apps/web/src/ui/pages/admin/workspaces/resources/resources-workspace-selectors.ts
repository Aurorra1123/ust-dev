import type {
  AdminResourceDetailResponse,
  ResourceType
} from "@campusbook/shared-types";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import type {
  AcademicAreaGroup,
  ResourceFormState,
  ResourceUnitFormState
} from "./resources-workspace-helpers";
import { buildAcademicAreaGroups } from "./resources-workspace-helpers";

export type ResourceWorkspaceDomain = "all" | "sports" | "academic";
export type ActiveInlinePanel =
  | { kind: "createResource" }
  | { kind: "editResource"; resourceId: string }
  | { kind: "createUnit"; resourceId: string }
  | { kind: "editUnit"; resourceId: string; unitId: string };

export function getLockedResourceType(domain: ResourceWorkspaceDomain): ResourceType | null {
  if (domain === "sports") {
    return "sports_facility";
  }

  if (domain === "academic") {
    return "academic_space";
  }

  return null;
}

export function getPanelResourceId(panel: ActiveInlinePanel | null) {
  if (!panel || panel.kind === "createResource") {
    return null;
  }

  return panel.resourceId;
}

export function getDomainResources(
  resources: AdminResourceDetailResponse[] | undefined,
  lockedResourceType: ResourceType | null
) {
  const allResources = resources ?? [];

  if (!lockedResourceType) {
    return allResources;
  }

  return allResources.filter((resource) => resource.type === lockedResourceType);
}

export function getAcademicAreaGroups(
  domain: ResourceWorkspaceDomain,
  resources: AdminResourceDetailResponse[],
  locale: Locale
): AcademicAreaGroup[] {
  return domain === "academic" ? buildAcademicAreaGroups(resources, locale) : [];
}

export function getVisibleResources(
  domain: ResourceWorkspaceDomain,
  domainResources: AdminResourceDetailResponse[],
  academicAreaGroups: AcademicAreaGroup[],
  academicAreaKey: string
) {
  if (domain !== "academic") {
    return domainResources;
  }

  return academicAreaGroups.find((group) => group.key === academicAreaKey)?.resources ?? [];
}

export function getActiveResource(
  resources: AdminResourceDetailResponse[],
  panel: ActiveInlinePanel | null
) {
  const resourceId = getPanelResourceId(panel);

  if (!resourceId) {
    return null;
  }

  return resources.find((resource) => resource.id === resourceId) ?? null;
}

export function getActiveUnit(
  activeResource: AdminResourceDetailResponse | null,
  panel: ActiveInlinePanel | null
) {
  if (!activeResource || panel?.kind !== "editUnit") {
    return null;
  }

  return activeResource.units.find((unit) => unit.id === panel.unitId) ?? null;
}

export function validateResourceForm(form: ResourceFormState) {
  return form.code.trim().length > 0 && form.name.trim().length > 0;
}

export function validateResourceUnitForm(form: ResourceUnitFormState) {
  return (
    form.code.trim().length > 0 &&
    form.name.trim().length > 0 &&
    form.unitType.trim().length > 0 &&
    form.capacity > 0
  );
}

export function getWorkspaceCopy(domain: ResourceWorkspaceDomain, locale: Locale) {
  return {
    title:
      domain === "sports"
        ? localeText(locale, "体育场馆", "Sports Venues")
        : domain === "academic"
          ? localeText(locale, "学术空间", "Academic Spaces")
          : localeText(locale, "资源工作区", "Resource Workspace"),
    description:
      domain === "sports"
        ? localeText(
            locale,
            "查看并维护体育场馆、场地单元和开放状态。",
            "View and maintain sports venues, bookable units, and availability status."
          )
        : domain === "academic"
          ? localeText(
              locale,
              "查看并维护学术空间、房间单元和区域分布。",
              "View and maintain academic spaces, room units, and area distribution."
            )
          : localeText(
              locale,
              "查看并维护资源及其预约单元。",
              "View and maintain resources together with their bookable units."
            ),
    loadingTitle:
      domain === "sports"
        ? localeText(locale, "正在载入体育场馆", "Loading sports venues")
        : domain === "academic"
          ? localeText(locale, "正在载入学术空间", "Loading academic spaces")
          : localeText(locale, "正在载入资源工作区", "Loading resource workspace"),
    loadingDescription:
      domain === "sports"
        ? localeText(
            locale,
            "正在载入体育场馆和场地信息。",
            "Loading sports venues and court information."
          )
        : domain === "academic"
          ? localeText(
              locale,
              "正在载入学术空间和房间信息。",
              "Loading academic spaces and room information."
            )
          : localeText(
              locale,
              "正在载入资源和单元信息。",
              "Loading resources and unit information."
            ),
    errorTitle:
      domain === "sports"
        ? localeText(locale, "体育场馆暂时无法加载", "Sports venues are unavailable")
        : domain === "academic"
          ? localeText(locale, "学术空间暂时无法加载", "Academic spaces are unavailable")
          : localeText(locale, "资源工作区暂时无法加载", "Resource workspace is unavailable")
  };
}
