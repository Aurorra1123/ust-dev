import type { AdminResourceDetailResponse, ResourceType } from "@campusbook/shared-types";
import type { Dispatch, SetStateAction } from "react";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { StatusPill } from "../../../../user-experience-kit";
import { resourceTypeLabel } from "../../admin-helpers";
import { MutationState } from "../../components/mutation-state";
import type {
  ResourceFormState,
  ResourceUnitFormState
} from "./resources-workspace-helpers";

type MutationStateLike = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
};

export function ResourcesActionsPanel({
  locale,
  selectedResource,
  resourceForm,
  setResourceForm,
  resourceUnitForm,
  setResourceUnitForm,
  lockedResourceType,
  createResourceMutation,
  createResourceUnitMutation,
  isCreateResourceValid,
  isCreateResourceUnitValid,
  onCreateResource,
  onCreateResourceUnit
}: {
  locale: Locale;
  selectedResource: AdminResourceDetailResponse | null;
  resourceForm: ResourceFormState;
  setResourceForm: Dispatch<SetStateAction<ResourceFormState>>;
  resourceUnitForm: ResourceUnitFormState;
  setResourceUnitForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  lockedResourceType: ResourceType | null;
  createResourceMutation: MutationStateLike;
  createResourceUnitMutation: MutationStateLike;
  isCreateResourceValid: boolean;
  isCreateResourceUnitValid: boolean;
  onCreateResource: () => void;
  onCreateResourceUnit: () => void;
}) {
  return (
    <div className="grid gap-4">
      <form
        className="rounded-[24px] border border-ink/10 bg-mist px-5 py-5"
        onSubmit={(event) => {
          event.preventDefault();
          onCreateResource();
        }}
      >
        <h3 className="text-lg font-semibold text-ink">
          {localeText(locale, "新增资源", "Create Resource")}
        </h3>
        <div className="mt-4 grid gap-3">
          {lockedResourceType ? (
            <div className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm text-ink">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                {localeText(locale, "当前模块", "Current module")}
              </p>
              <div className="mt-2">
                <StatusPill tone="brand">
                  {resourceTypeLabel(lockedResourceType, locale)}
                </StatusPill>
              </div>
            </div>
          ) : (
            <select
              className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceForm.type}
              onChange={(event) =>
                setResourceForm((current) => ({
                  ...current,
                  type: event.target.value as AdminResourceDetailResponse["type"]
                }))
              }
            >
              <option value="academic_space">{localeText(locale, "学术空间", "Study Space")}</option>
              <option value="sports_facility">{localeText(locale, "体育设施", "Sports Facility")}</option>
            </select>
          )}
          <input
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceForm.code}
            onChange={(event) =>
              setResourceForm((current) => ({
                ...current,
                code: event.target.value
              }))
            }
            placeholder={localeText(locale, "资源编码", "Resource code")}
          />
          <input
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceForm.name}
            onChange={(event) =>
              setResourceForm((current) => ({
                ...current,
                name: event.target.value
              }))
            }
            placeholder={localeText(locale, "资源名称", "Resource name")}
          />
          <input
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceForm.location}
            onChange={(event) =>
              setResourceForm((current) => ({
                ...current,
                location: event.target.value
              }))
            }
            placeholder={localeText(locale, "位置", "Location")}
          />
          <textarea
            className="min-h-[96px] rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceForm.description}
            onChange={(event) =>
              setResourceForm((current) => ({
                ...current,
                description: event.target.value
              }))
            }
            placeholder={localeText(locale, "描述", "Description")}
          />
        </div>
        <MutationState
          mutation={createResourceMutation}
          success={localeText(locale, "资源已创建。", "Resource created.")}
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
          disabled={!isCreateResourceValid || createResourceMutation.isPending}
        >
          {createResourceMutation.isPending
            ? localeText(locale, "创建中", "Creating")
            : localeText(locale, "创建资源", "Create Resource")}
        </button>
      </form>

      <form
        className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
        onSubmit={(event) => {
          event.preventDefault();
          onCreateResourceUnit();
        }}
      >
        <h3 className="text-lg font-semibold text-ink">
          {localeText(locale, "新增资源单元", "Create Resource Unit")}
        </h3>
        <p className="mt-2 text-sm text-ink/70">
          {localeText(locale, "当前资源：", "Current resource: ")}
          {selectedResource?.name ||
            localeText(locale, "请先选择左侧资源", "Select a resource from the left")}
        </p>
        <div className="mt-4 grid gap-3">
          <input
            className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceUnitForm.code}
            onChange={(event) =>
              setResourceUnitForm((current) => ({
                ...current,
                code: event.target.value
              }))
            }
            placeholder={localeText(locale, "单元编码", "Unit code")}
          />
          <input
            className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceUnitForm.name}
            onChange={(event) =>
              setResourceUnitForm((current) => ({
                ...current,
                name: event.target.value
              }))
            }
            placeholder={localeText(locale, "单元名称", "Unit name")}
          />
          <input
            className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceUnitForm.unitType}
            onChange={(event) =>
              setResourceUnitForm((current) => ({
                ...current,
                unitType: event.target.value
              }))
            }
            placeholder={localeText(locale, "单元类型", "Unit type")}
          />
        </div>
        <MutationState
          mutation={createResourceUnitMutation}
          success={localeText(locale, "资源单元已创建。", "Resource unit created.")}
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-moss px-5 py-3 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:bg-moss/50"
          disabled={!isCreateResourceUnitValid || createResourceUnitMutation.isPending}
        >
          {createResourceUnitMutation.isPending
            ? localeText(locale, "创建中", "Creating")
            : localeText(locale, "创建资源单元", "Create Resource Unit")}
        </button>
      </form>
    </div>
  );
}
