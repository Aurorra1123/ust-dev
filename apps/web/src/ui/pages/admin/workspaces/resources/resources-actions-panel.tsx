import type { AdminResourceDetailResponse, ResourceType } from "@campusbook/shared-types";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { availabilityModeLabel, resourceTypeLabel } from "../../admin-helpers";
import { MutationState } from "../../components/mutation-state";
import type {
  ResourceFormState,
  ResourceUnitFormState
} from "./resources-workspace-helpers";
import { formatResourceMutationError } from "./resources-workspace-helpers";

type MutationStateLike = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
};

export function ResourcesActionsPanel({
  locale,
  selectedResource,
  selectedUnit,
  resourceCreateForm,
  setResourceCreateForm,
  resourceEditForm,
  setResourceEditForm,
  resourceUnitCreateForm,
  setResourceUnitCreateForm,
  resourceUnitEditForm,
  setResourceUnitEditForm,
  lockedResourceType,
  createResourceMutation,
  updateResourceMutation,
  createResourceUnitMutation,
  updateResourceUnitMutation,
  isCreateResourceValid,
  isEditResourceValid,
  isCreateResourceUnitValid,
  isEditResourceUnitValid,
  onCreateResource,
  onSaveResource,
  onCreateResourceUnit,
  onSaveResourceUnit
}: {
  locale: Locale;
  selectedResource: AdminResourceDetailResponse | null;
  selectedUnit: AdminResourceDetailResponse["units"][number] | null;
  resourceCreateForm: ResourceFormState;
  setResourceCreateForm: Dispatch<SetStateAction<ResourceFormState>>;
  resourceEditForm: ResourceFormState;
  setResourceEditForm: Dispatch<SetStateAction<ResourceFormState>>;
  resourceUnitCreateForm: ResourceUnitFormState;
  setResourceUnitCreateForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  resourceUnitEditForm: ResourceUnitFormState;
  setResourceUnitEditForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  lockedResourceType: ResourceType | null;
  createResourceMutation: MutationStateLike;
  updateResourceMutation: MutationStateLike;
  createResourceUnitMutation: MutationStateLike;
  updateResourceUnitMutation: MutationStateLike;
  isCreateResourceValid: boolean;
  isEditResourceValid: boolean;
  isCreateResourceUnitValid: boolean;
  isEditResourceUnitValid: boolean;
  onCreateResource: () => void;
  onSaveResource: () => void;
  onCreateResourceUnit: () => void;
  onSaveResourceUnit: () => void;
}) {
  const createModeOptions = lockedResourceType
    ? [{ value: lockedResourceType, label: resourceTypeLabel(lockedResourceType, locale) }]
    : [
        { value: "academic_space" as const, label: localeText(locale, "学术空间", "Study Space") },
        { value: "sports_facility" as const, label: localeText(locale, "体育设施", "Sports Facility") }
      ];
  const unitModeOptions =
    selectedResource?.type === "sports_facility"
      ? [{ value: "discrete_slot" as const, label: availabilityModeLabel("discrete_slot", locale) }]
      : [{ value: "continuous" as const, label: availabilityModeLabel("continuous", locale) }];

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
        <p className="mt-2 text-sm text-slate">
          {localeText(
            locale,
            "资源页只做基础维护。先创建资源，再继续补资源单元。",
            "Resource pages only handle core maintenance. Create the resource first, then add units."
          )}
        </p>
        <div className="mt-4 grid gap-4">
          <ResourceTypeField
            locale={locale}
            value={resourceCreateForm.type}
            options={createModeOptions}
            locked={Boolean(lockedResourceType)}
            onChange={(value) =>
              setResourceCreateForm((current) => ({
                ...current,
                type: value
              }))
            }
          />
          <FieldBlock
            label={localeText(locale, "资源编码", "Resource Code")}
            hint={localeText(
              locale,
              "使用稳定、唯一的业务编码，例如 E4-RM-201 或 BADMINTON-A。",
              "Use a stable and unique business code, such as E4-RM-201 or BADMINTON-A."
            )}
          >
            <input
              className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceCreateForm.code}
              onChange={(event) =>
                setResourceCreateForm((current) => ({
                  ...current,
                  code: event.target.value
                }))
              }
              placeholder={localeText(locale, "资源编码", "Resource code")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "资源名称", "Resource Name")}
            hint={localeText(
              locale,
              "填写管理员和学生都能直接理解的名称，避免只写内部简称。",
              "Use a name that both admins and students can understand instead of an internal shorthand."
            )}
          >
            <input
              className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceCreateForm.name}
              onChange={(event) =>
                setResourceCreateForm((current) => ({
                  ...current,
                  name: event.target.value
                }))
              }
              placeholder={localeText(locale, "资源名称", "Resource name")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "位置", "Location")}
            hint={localeText(
              locale,
              "位置会直接影响管理员检索和学生理解，建议写楼栋、楼层或场馆区位。",
              "Location affects both admin search and student understanding. Prefer building, floor, or venue area details."
            )}
          >
            <input
              className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceCreateForm.location}
              onChange={(event) =>
                setResourceCreateForm((current) => ({
                  ...current,
                  location: event.target.value
                }))
              }
              placeholder={localeText(locale, "位置", "Location")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "描述", "Description")}
            hint={localeText(
              locale,
              "描述用于补充用途、容量或使用提醒，可为空，但建议在正式演示资源中补齐。",
              "Use the description for purpose, capacity, or usage notes. It can stay empty, but demo-ready resources should usually include it."
            )}
          >
            <textarea
              className="min-h-[96px] rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceCreateForm.description}
              onChange={(event) =>
                setResourceCreateForm((current) => ({
                  ...current,
                  description: event.target.value
                }))
              }
              placeholder={localeText(locale, "描述", "Description")}
            />
          </FieldBlock>
        </div>
        <MutationState
          mutation={createResourceMutation}
          success={localeText(locale, "资源已创建。", "Resource created.")}
          formatError={(error) => formatResourceMutationError(error, locale)}
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
          onSaveResource();
        }}
      >
        <h3 className="text-lg font-semibold text-ink">
          {localeText(locale, "编辑当前资源", "Edit Current Resource")}
        </h3>
        <p className="mt-2 text-sm text-slate">
          {selectedResource
            ? localeText(
                locale,
                "当前选中的资源会在这里直接编辑保存。",
                "The selected resource can be edited and saved directly here."
              )
            : localeText(
                locale,
                "请先在左侧选择一个资源，再进行编辑。",
                "Select a resource on the left before editing."
              )}
        </p>
        <div className="mt-4 grid gap-4">
          <ResourceTypeField
            locale={locale}
            value={resourceEditForm.type}
            options={createModeOptions}
            locked={Boolean(lockedResourceType)}
            onChange={(value) =>
              setResourceEditForm((current) => ({
                ...current,
                type: value
              }))
            }
          />
          <FieldBlock
            label={localeText(locale, "资源编码", "Resource Code")}
            hint={localeText(
              locale,
              "修改编码会直接影响管理员检索和学术空间分区归类，保存前请确认新编码仍符合命名规则。",
              "Changing the code affects admin search and academic space grouping. Confirm the new code still follows naming rules before saving."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceEditForm.code}
              onChange={(event) =>
                setResourceEditForm((current) => ({
                  ...current,
                  code: event.target.value
                }))
              }
              placeholder={localeText(locale, "资源编码", "Resource code")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "资源名称", "Resource Name")}
            hint={localeText(
              locale,
              "资源名称建议与现场标识一致，便于学生下单和管理员排查。",
              "Keep the resource name aligned with on-site signage so students and admins can identify it easily."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceEditForm.name}
              onChange={(event) =>
                setResourceEditForm((current) => ({
                  ...current,
                  name: event.target.value
                }))
              }
              placeholder={localeText(locale, "资源名称", "Resource name")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "位置", "Location")}
            hint={localeText(
              locale,
              "位置建议写到楼栋、楼层或场馆区域粒度，避免只写 campus 级别的大范围信息。",
              "Describe the location at building, floor, or venue-area granularity instead of only a campus-level reference."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceEditForm.location}
              onChange={(event) =>
                setResourceEditForm((current) => ({
                  ...current,
                  location: event.target.value
                }))
              }
              placeholder={localeText(locale, "位置", "Location")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "描述", "Description")}
            hint={localeText(
              locale,
              "描述适合补充用途、适用人群、配套设备或使用限制。",
              "Use the description to clarify purpose, audience, equipment, or usage restrictions."
            )}
          >
            <textarea
              className="min-h-[96px] rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceEditForm.description}
              onChange={(event) =>
                setResourceEditForm((current) => ({
                  ...current,
                  description: event.target.value
                }))
              }
              placeholder={localeText(locale, "描述", "Description")}
            />
          </FieldBlock>
        </div>
        <MutationState
          mutation={updateResourceMutation}
          pending={localeText(locale, "正在保存资源修改。", "Saving resource changes.")}
          success={localeText(locale, "资源信息已更新。", "Resource information updated.")}
          formatError={(error) => formatResourceMutationError(error, locale)}
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-navy px-5 py-3 text-sm font-medium text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-navy/50"
          disabled={!selectedResource || !isEditResourceValid || updateResourceMutation.isPending}
        >
          {updateResourceMutation.isPending
            ? localeText(locale, "保存中", "Saving")
            : localeText(locale, "保存资源修改", "Save Resource Changes")}
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
        <p className="mt-2 text-sm text-slate">
          {localeText(locale, "当前资源：", "Current resource: ")}
          {selectedResource?.name ||
            localeText(locale, "请先选择左侧资源", "Select a resource from the left")}
        </p>
        <div className="mt-4 grid gap-4">
          <FieldBlock
            label={localeText(locale, "单元编码", "Unit Code")}
            hint={localeText(
              locale,
              "单元编码应在同一资源下保持唯一，适合写房间号、场地号等可定位编号。",
              "Keep the unit code unique within the same resource. Room numbers and court numbers work well here."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceUnitCreateForm.code}
              onChange={(event) =>
                setResourceUnitCreateForm((current) => ({
                  ...current,
                  code: event.target.value
                }))
              }
              placeholder={localeText(locale, "单元编码", "Unit code")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "单元名称", "Unit Name")}
            hint={localeText(
              locale,
              "建议与现场门牌、场地编号或预约对象名称一致。",
              "Keep the unit name aligned with door labels, court numbers, or the actual booking target."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceUnitCreateForm.name}
              onChange={(event) =>
                setResourceUnitCreateForm((current) => ({
                  ...current,
                  name: event.target.value
                }))
              }
              placeholder={localeText(locale, "单元名称", "Unit name")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "单元类型", "Unit Type")}
            hint={localeText(
              locale,
              "学术空间通常是 room，体育场馆通常是 court；也可以按业务需要写更细分的类型。",
              "Academic spaces are typically rooms and sports venues are typically courts, but you can use a more specific type when needed."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceUnitCreateForm.unitType}
              onChange={(event) =>
                setResourceUnitCreateForm((current) => ({
                  ...current,
                  unitType: event.target.value
                }))
              }
              placeholder={localeText(locale, "单元类型", "Unit type")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "可用性模式", "Availability Mode")}
            hint={localeText(
              locale,
              "学术空间使用连续时间段，体育场馆使用离散时段。该字段会影响学生端的可预约视图。",
              "Academic spaces use continuous timelines while sports venues use discrete slots. This field affects the student booking view."
            )}
          >
            <select
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceUnitCreateForm.availabilityMode}
              onChange={(event) =>
                setResourceUnitCreateForm((current) => ({
                  ...current,
                  availabilityMode: event.target.value as ResourceUnitFormState["availabilityMode"]
                }))
              }
              disabled={!selectedResource}
            >
              {unitModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "容量", "Capacity")}
            hint={localeText(
              locale,
              "填写该单元可同时容纳的人数。若是单场地，可直接填写 1。",
              "Enter how many people the unit can host at the same time. For a single court, 1 is usually enough."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              type="number"
              min={1}
              value={resourceUnitCreateForm.capacity}
              onChange={(event) =>
                setResourceUnitCreateForm((current) => ({
                  ...current,
                  capacity: Number(event.target.value)
                }))
              }
              placeholder={localeText(locale, "容量", "Capacity")}
            />
          </FieldBlock>
        </div>
        <MutationState
          mutation={createResourceUnitMutation}
          success={localeText(locale, "资源单元已创建。", "Resource unit created.")}
          formatError={(error) => formatResourceMutationError(error, locale)}
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

      <form
        className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSaveResourceUnit();
        }}
      >
        <h3 className="text-lg font-semibold text-ink">
          {localeText(locale, "编辑当前资源单元", "Edit Current Resource Unit")}
        </h3>
        <p className="mt-2 text-sm text-slate">
          {selectedUnit
            ? localeText(
                locale,
                "先在左侧单元卡片中选中目标单元，再在这里保存修改。",
                "Select a unit card on the left first, then save changes here."
              )
            : localeText(
                locale,
                "当前资源还没有可编辑的资源单元。",
                "There is no editable unit under the current resource yet."
              )}
        </p>
        <div className="mt-4 grid gap-4">
          <FieldBlock
            label={localeText(locale, "单元编码", "Unit Code")}
            hint={localeText(
              locale,
              "编码变更后仍需保持唯一，并建议继续与现场编号一致。",
              "The updated code should remain unique and stay aligned with on-site numbering."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceUnitEditForm.code}
              onChange={(event) =>
                setResourceUnitEditForm((current) => ({
                  ...current,
                  code: event.target.value
                }))
              }
              placeholder={localeText(locale, "单元编码", "Unit code")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "单元名称", "Unit Name")}
            hint={localeText(
              locale,
              "名称建议直接体现预约对象，避免学生端看到多个含义不明的单元。",
              "Keep the name directly tied to the booking target so students do not see ambiguous units."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceUnitEditForm.name}
              onChange={(event) =>
                setResourceUnitEditForm((current) => ({
                  ...current,
                  name: event.target.value
                }))
              }
              placeholder={localeText(locale, "单元名称", "Unit name")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "单元类型", "Unit Type")}
            hint={localeText(
              locale,
              "单元类型用于帮助管理员快速区分 room、court 或其他业务定义。",
              "Use the unit type to distinguish rooms, courts, or any other business-defined unit quickly."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceUnitEditForm.unitType}
              onChange={(event) =>
                setResourceUnitEditForm((current) => ({
                  ...current,
                  unitType: event.target.value
                }))
              }
              placeholder={localeText(locale, "单元类型", "Unit type")}
            />
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "可用性模式", "Availability Mode")}
            hint={localeText(
              locale,
              "该模式必须与资源类型一致：学术空间是连续时间段，体育场馆是离散时段。",
              "The mode must stay aligned with the resource type: continuous for academic spaces and discrete for sports venues."
            )}
          >
            <select
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={resourceUnitEditForm.availabilityMode}
              onChange={(event) =>
                setResourceUnitEditForm((current) => ({
                  ...current,
                  availabilityMode: event.target.value as ResourceUnitFormState["availabilityMode"]
                }))
              }
              disabled={!selectedUnit}
            >
              {unitModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldBlock>
          <FieldBlock
            label={localeText(locale, "容量", "Capacity")}
            hint={localeText(
              locale,
              "容量变化会直接影响资源说明和学生理解，更新后请确认是否与现场一致。",
              "Capacity changes affect both the resource description and student expectations, so confirm it still matches the actual setup."
            )}
          >
            <input
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              type="number"
              min={1}
              value={resourceUnitEditForm.capacity}
              onChange={(event) =>
                setResourceUnitEditForm((current) => ({
                  ...current,
                  capacity: Number(event.target.value)
                }))
              }
              placeholder={localeText(locale, "容量", "Capacity")}
            />
          </FieldBlock>
        </div>
        <MutationState
          mutation={updateResourceUnitMutation}
          pending={localeText(locale, "正在保存资源单元修改。", "Saving unit changes.")}
          success={localeText(locale, "资源单元信息已更新。", "Resource unit updated.")}
          formatError={(error) => formatResourceMutationError(error, locale)}
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-navy px-5 py-3 text-sm font-medium text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-navy/50"
          disabled={
            !selectedUnit || !isEditResourceUnitValid || updateResourceUnitMutation.isPending
          }
        >
          {updateResourceUnitMutation.isPending
            ? localeText(locale, "保存中", "Saving")
            : localeText(locale, "保存资源单元修改", "Save Unit Changes")}
        </button>
      </form>
    </div>
  );
}

function FieldBlock({
  label,
  hint,
  children
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-1 text-xs leading-6 text-slate">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function ResourceTypeField({
  locale,
  value,
  options,
  locked,
  onChange
}: {
  locale: Locale;
  value: ResourceType;
  options: Array<{ value: ResourceType; label: string }>;
  locked: boolean;
  onChange: (value: ResourceType) => void;
}) {
  return (
    <FieldBlock
      label={localeText(locale, "资源类型", "Resource Type")}
      hint={localeText(
        locale,
        "资源类型决定它属于体育场馆还是学术空间，并影响后续资源单元的预约模式。",
        "The resource type determines whether it belongs to sports venues or academic spaces and affects the unit booking mode that follows."
      )}
    >
      {locked ? (
        <div className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink">
          {options[0]?.label ?? resourceTypeLabel(value, locale)}
        </div>
      ) : (
        <select
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
          value={value}
          onChange={(event) => onChange(event.target.value as ResourceType)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldBlock>
  );
}
