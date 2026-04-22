import type { AdminResourceDetailResponse, ResourceType } from "@campusbook/shared-types";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { EmptyPanel, StatusPill } from "../../../../user-experience-kit";
import {
  availabilityModeLabel,
  resourceTypeLabel
} from "../../admin-helpers";
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

type ResourceModeOption = {
  value: ResourceType;
  label: string;
};

export function ResourcesCatalogPanel({
  locale,
  resources,
  lockedResourceType,
  isCreatingResource,
  editingResourceId,
  creatingUnitResourceId,
  editingUnitTarget,
  resourceCreateForm,
  setResourceCreateForm,
  resourceEditForm,
  setResourceEditForm,
  resourceUnitCreateForm,
  setResourceUnitCreateForm,
  resourceUnitEditForm,
  setResourceUnitEditForm,
  createResourceMutation,
  updateResourceMutation,
  createResourceUnitMutation,
  updateResourceUnitMutation,
  updateResourceStatusMutation,
  deleteResourceMutation,
  deleteResourceUnitMutation,
  statusFeedbackResourceId,
  deleteFeedbackResourceId,
  deleteUnitFeedbackResourceId,
  isCreateResourceValid,
  isEditResourceValid,
  isCreateResourceUnitValid,
  isEditResourceUnitValid,
  onStartCreateResource,
  onCancelCreateResource,
  onCreateResource,
  onStartEditResource,
  onCancelEditResource,
  onSaveResource,
  onStartCreateResourceUnit,
  onCancelCreateResourceUnit,
  onCreateResourceUnit,
  onStartEditResourceUnit,
  onCancelEditResourceUnit,
  onSaveResourceUnit,
  onToggleResourceStatus,
  onDeleteResource,
  onDeleteResourceUnit
}: {
  locale: Locale;
  resources: AdminResourceDetailResponse[];
  lockedResourceType: ResourceType | null;
  isCreatingResource: boolean;
  editingResourceId: string;
  creatingUnitResourceId: string;
  editingUnitTarget: { resourceId: string; unitId: string } | null;
  resourceCreateForm: ResourceFormState;
  setResourceCreateForm: Dispatch<SetStateAction<ResourceFormState>>;
  resourceEditForm: ResourceFormState;
  setResourceEditForm: Dispatch<SetStateAction<ResourceFormState>>;
  resourceUnitCreateForm: ResourceUnitFormState;
  setResourceUnitCreateForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  resourceUnitEditForm: ResourceUnitFormState;
  setResourceUnitEditForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  createResourceMutation: MutationStateLike;
  updateResourceMutation: MutationStateLike;
  createResourceUnitMutation: MutationStateLike;
  updateResourceUnitMutation: MutationStateLike;
  updateResourceStatusMutation: MutationStateLike;
  deleteResourceMutation: MutationStateLike;
  deleteResourceUnitMutation: MutationStateLike;
  statusFeedbackResourceId: string;
  deleteFeedbackResourceId: string;
  deleteUnitFeedbackResourceId: string;
  isCreateResourceValid: boolean;
  isEditResourceValid: boolean;
  isCreateResourceUnitValid: boolean;
  isEditResourceUnitValid: boolean;
  onStartCreateResource: () => void;
  onCancelCreateResource: () => void;
  onCreateResource: () => void;
  onStartEditResource: (resourceId: string) => void;
  onCancelEditResource: (resourceId: string) => void;
  onSaveResource: () => void;
  onStartCreateResourceUnit: (resourceId: string) => void;
  onCancelCreateResourceUnit: (resourceId: string) => void;
  onCreateResourceUnit: () => void;
  onStartEditResourceUnit: (resourceId: string, unitId: string) => void;
  onCancelEditResourceUnit: (resourceId: string, unitId: string) => void;
  onSaveResourceUnit: () => void;
  onToggleResourceStatus: (resourceId: string) => void;
  onDeleteResource: (resourceId: string) => void;
  onDeleteResourceUnit: (resourceId: string, unitId: string) => void;
}) {
  const createModeOptions = lockedResourceType
    ? [{ value: lockedResourceType, label: resourceTypeLabel(lockedResourceType, locale) }]
    : [
        { value: "academic_space" as const, label: localeText(locale, "学术空间", "Study Space") },
        { value: "sports_facility" as const, label: localeText(locale, "体育设施", "Sports Facility") }
      ];

  return (
    <div className="grid gap-4">
      {resources.length === 0 ? (
        <EmptyPanel
          title={localeText(locale, "当前还没有资源", "No resources yet")}
          description={localeText(
            locale,
            "可通过下方入口新增资源，创建后继续补充单元、位置和开放状态。",
            "Use the entry below to create the first resource, then continue with units, location, and status."
          )}
        />
      ) : null}

      {resources.map((resource) => (
        <ResourceCatalogCard
          key={resource.id}
          locale={locale}
          resource={resource}
          lockedResourceType={lockedResourceType}
          createModeOptions={createModeOptions}
          isEditingResource={editingResourceId === resource.id}
          isCreatingUnit={creatingUnitResourceId === resource.id}
          editingUnitTarget={editingUnitTarget}
          resourceEditForm={resourceEditForm}
          setResourceEditForm={setResourceEditForm}
          resourceUnitCreateForm={resourceUnitCreateForm}
          setResourceUnitCreateForm={setResourceUnitCreateForm}
          resourceUnitEditForm={resourceUnitEditForm}
          setResourceUnitEditForm={setResourceUnitEditForm}
          updateResourceMutation={updateResourceMutation}
          createResourceUnitMutation={createResourceUnitMutation}
          updateResourceUnitMutation={updateResourceUnitMutation}
          updateResourceStatusMutation={updateResourceStatusMutation}
          deleteResourceMutation={deleteResourceMutation}
          deleteResourceUnitMutation={deleteResourceUnitMutation}
          statusFeedbackResourceId={statusFeedbackResourceId}
          deleteFeedbackResourceId={deleteFeedbackResourceId}
          deleteUnitFeedbackResourceId={deleteUnitFeedbackResourceId}
          isEditResourceValid={isEditResourceValid}
          isCreateResourceUnitValid={isCreateResourceUnitValid}
          isEditResourceUnitValid={isEditResourceUnitValid}
          onStartEditResource={onStartEditResource}
          onCancelEditResource={onCancelEditResource}
          onSaveResource={onSaveResource}
          onStartCreateResourceUnit={onStartCreateResourceUnit}
          onCancelCreateResourceUnit={onCancelCreateResourceUnit}
          onCreateResourceUnit={onCreateResourceUnit}
          onStartEditResourceUnit={onStartEditResourceUnit}
          onCancelEditResourceUnit={onCancelEditResourceUnit}
          onSaveResourceUnit={onSaveResourceUnit}
          onToggleResourceStatus={onToggleResourceStatus}
          onDeleteResource={onDeleteResource}
          onDeleteResourceUnit={onDeleteResourceUnit}
        />
      ))}

      {isCreatingResource ? (
        <form
          className="rounded-[26px] border border-dashed border-ember/22 bg-white px-5 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            onCreateResource();
          }}
        >
          <div className="grid gap-4">
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
            <ResourceFields
              locale={locale}
              form={resourceCreateForm}
              setForm={setResourceCreateForm}
            />
          </div>
          <MutationState
            mutation={createResourceMutation}
            pending={localeText(locale, "正在创建资源。", "Creating resource.")}
            success={localeText(locale, "资源已创建。", "Resource created.")}
            formatError={(error) => formatResourceMutationError(error, locale)}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
              disabled={!isCreateResourceValid || createResourceMutation.isPending}
            >
              {createResourceMutation.isPending
                ? localeText(locale, "创建中", "Creating")
                : localeText(locale, "创建资源", "Create Resource")}
            </button>
            <button
              type="button"
              className="rounded-full border border-ink/10 px-5 py-3 text-sm text-ink transition hover:border-moss hover:text-moss"
              onClick={onCancelCreateResource}
            >
              {localeText(locale, "取消", "Cancel")}
            </button>
          </div>
        </form>
      ) : (
        <DashedActionCard
          title={localeText(locale, "新增资源", "Add Resource")}
          description={localeText(
            locale,
            "新增体育场馆或学术空间资源，创建后可继续补充预约单元。",
            "Add a new sports venue or academic space, then continue with its bookable units."
          )}
          buttonLabel={localeText(locale, "新增资源", "Add Resource")}
          onClick={onStartCreateResource}
        />
      )}
    </div>
  );
}

function ResourceCatalogCard({
  locale,
  resource,
  lockedResourceType,
  createModeOptions,
  isEditingResource,
  isCreatingUnit,
  editingUnitTarget,
  resourceEditForm,
  setResourceEditForm,
  resourceUnitCreateForm,
  setResourceUnitCreateForm,
  resourceUnitEditForm,
  setResourceUnitEditForm,
  updateResourceMutation,
  createResourceUnitMutation,
  updateResourceUnitMutation,
  updateResourceStatusMutation,
  deleteResourceMutation,
  deleteResourceUnitMutation,
  statusFeedbackResourceId,
  deleteFeedbackResourceId,
  deleteUnitFeedbackResourceId,
  isEditResourceValid,
  isCreateResourceUnitValid,
  isEditResourceUnitValid,
  onStartEditResource,
  onCancelEditResource,
  onSaveResource,
  onStartCreateResourceUnit,
  onCancelCreateResourceUnit,
  onCreateResourceUnit,
  onStartEditResourceUnit,
  onCancelEditResourceUnit,
  onSaveResourceUnit,
  onToggleResourceStatus,
  onDeleteResource,
  onDeleteResourceUnit
}: {
  locale: Locale;
  resource: AdminResourceDetailResponse;
  lockedResourceType: ResourceType | null;
  createModeOptions: ResourceModeOption[];
  isEditingResource: boolean;
  isCreatingUnit: boolean;
  editingUnitTarget: { resourceId: string; unitId: string } | null;
  resourceEditForm: ResourceFormState;
  setResourceEditForm: Dispatch<SetStateAction<ResourceFormState>>;
  resourceUnitCreateForm: ResourceUnitFormState;
  setResourceUnitCreateForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  resourceUnitEditForm: ResourceUnitFormState;
  setResourceUnitEditForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  updateResourceMutation: MutationStateLike;
  createResourceUnitMutation: MutationStateLike;
  updateResourceUnitMutation: MutationStateLike;
  updateResourceStatusMutation: MutationStateLike;
  deleteResourceMutation: MutationStateLike;
  deleteResourceUnitMutation: MutationStateLike;
  statusFeedbackResourceId: string;
  deleteFeedbackResourceId: string;
  deleteUnitFeedbackResourceId: string;
  isEditResourceValid: boolean;
  isCreateResourceUnitValid: boolean;
  isEditResourceUnitValid: boolean;
  onStartEditResource: (resourceId: string) => void;
  onCancelEditResource: (resourceId: string) => void;
  onSaveResource: () => void;
  onStartCreateResourceUnit: (resourceId: string) => void;
  onCancelCreateResourceUnit: (resourceId: string) => void;
  onCreateResourceUnit: () => void;
  onStartEditResourceUnit: (resourceId: string, unitId: string) => void;
  onCancelEditResourceUnit: (resourceId: string, unitId: string) => void;
  onSaveResourceUnit: () => void;
  onToggleResourceStatus: (resourceId: string) => void;
  onDeleteResource: (resourceId: string) => void;
  onDeleteResourceUnit: (resourceId: string, unitId: string) => void;
}) {
  const unitModeOptions =
    resource.type === "sports_facility"
      ? [
          {
            value: "discrete_slot" as const,
            label: availabilityModeLabel("discrete_slot", locale)
          }
        ]
      : [
          {
            value: "continuous" as const,
            label: availabilityModeLabel("continuous", locale)
          }
        ];

  return (
    <article className="rounded-[26px] border border-ink/10 bg-white px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-moss">
            {resourceTypeLabel(resource.type, locale)}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-ink">{resource.name}</h3>
          <p className="mt-2 text-sm text-ink/70">
            {resource.code} · {resource.location || localeText(locale, "未填写位置", "No location")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={resource.status === "active" ? "success" : "danger"}>
            {resource.status === "active"
              ? localeText(locale, "启用中", "Active")
              : localeText(locale, "已停用", "Inactive")}
          </StatusPill>
          {resource.units.length === 0 ? (
            <StatusPill tone="danger">{localeText(locale, "未配置单元", "No Units")}</StatusPill>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full border border-moss/20 px-4 py-2 text-sm text-moss transition hover:bg-moss/10"
          onClick={() =>
            isEditingResource
              ? onCancelEditResource(resource.id)
              : onStartEditResource(resource.id)
          }
        >
          {isEditingResource
            ? localeText(locale, "取消编辑", "Cancel Edit")
            : localeText(locale, "编辑", "Edit")}
        </button>
        <button
          type="button"
          className="rounded-full border border-ember/20 px-4 py-2 text-sm text-ember transition hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onToggleResourceStatus(resource.id)}
          disabled={updateResourceStatusMutation.isPending}
        >
          {resource.status === "active"
            ? localeText(locale, "停用", "Deactivate")
            : localeText(locale, "启用", "Activate")}
        </button>
        <button
          type="button"
          className="rounded-full border border-danger/20 px-4 py-2 text-sm text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onDeleteResource(resource.id)}
          disabled={deleteResourceMutation.isPending}
        >
          {localeText(locale, "删除", "Delete")}
        </button>
      </div>

      {isEditingResource ? (
        <form
          className="mt-5 rounded-[24px] border border-ember/18 bg-ember/5 px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSaveResource();
          }}
        >
          <div className="grid gap-4">
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
            <ResourceFields locale={locale} form={resourceEditForm} setForm={setResourceEditForm} />
          </div>
          <MutationState
            mutation={updateResourceMutation}
            pending={localeText(locale, "正在保存资源修改。", "Saving resource changes.")}
            success={localeText(locale, "资源信息已更新。", "Resource information updated.")}
            formatError={(error) => formatResourceMutationError(error, locale)}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-navy px-5 py-3 text-sm font-medium text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-navy/50"
              disabled={!isEditResourceValid || updateResourceMutation.isPending}
            >
              {updateResourceMutation.isPending
                ? localeText(locale, "保存中", "Saving")
                : localeText(locale, "保存资源修改", "Save Resource Changes")}
            </button>
            <button
              type="button"
              className="rounded-full border border-ink/10 px-5 py-3 text-sm text-ink transition hover:border-moss hover:text-moss"
              onClick={() => onCancelEditResource(resource.id)}
            >
              {localeText(locale, "取消", "Cancel")}
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="mt-5 text-sm leading-7 text-slate">
            {resource.description ||
              localeText(locale, "当前资源暂无补充描述。", "No additional description for this resource yet.")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InlineInfoCard label={localeText(locale, "资源编码", "Resource Code")} value={resource.code} />
            <InlineInfoCard
              label={localeText(locale, "当前位置", "Location")}
              value={resource.location || localeText(locale, "未填写", "Not set")}
            />
            <InlineInfoCard
              label={localeText(locale, "资源单元", "Units")}
              value={localeText(locale, `${resource.units.length} 个`, `${resource.units.length}`)}
            />
          </div>
        </>
      )}

      {statusFeedbackResourceId === resource.id ? (
        <MutationState
          mutation={updateResourceStatusMutation}
          pending={localeText(locale, "正在更新资源状态。", "Updating resource status.")}
          success={localeText(locale, "资源状态已更新。", "Resource status updated.")}
          formatError={(error) => formatResourceMutationError(error, locale)}
        />
      ) : null}
      {deleteFeedbackResourceId === resource.id ? (
        <MutationState
          mutation={deleteResourceMutation}
          pending={localeText(locale, "正在删除资源。", "Deleting resource.")}
          success={localeText(locale, "资源已删除。", "Resource deleted.")}
          formatError={(error) => formatResourceMutationError(error, locale)}
        />
      ) : null}

      <ResourceUnitsSection
        locale={locale}
        resource={resource}
        unitModeOptions={unitModeOptions}
        editingUnitTarget={editingUnitTarget}
        resourceUnitCreateForm={resourceUnitCreateForm}
        setResourceUnitCreateForm={setResourceUnitCreateForm}
        resourceUnitEditForm={resourceUnitEditForm}
        setResourceUnitEditForm={setResourceUnitEditForm}
        createResourceUnitMutation={createResourceUnitMutation}
        updateResourceUnitMutation={updateResourceUnitMutation}
        deleteResourceUnitMutation={deleteResourceUnitMutation}
        deleteUnitFeedbackResourceId={deleteUnitFeedbackResourceId}
        isCreatingUnit={isCreatingUnit}
        isCreateResourceUnitValid={isCreateResourceUnitValid}
        isEditResourceUnitValid={isEditResourceUnitValid}
        onStartCreateResourceUnit={onStartCreateResourceUnit}
        onCancelCreateResourceUnit={onCancelCreateResourceUnit}
        onCreateResourceUnit={onCreateResourceUnit}
        onStartEditResourceUnit={onStartEditResourceUnit}
        onCancelEditResourceUnit={onCancelEditResourceUnit}
        onSaveResourceUnit={onSaveResourceUnit}
        onDeleteResourceUnit={onDeleteResourceUnit}
      />
    </article>
  );
}

function ResourceUnitsSection({
  locale,
  resource,
  unitModeOptions,
  editingUnitTarget,
  resourceUnitCreateForm,
  setResourceUnitCreateForm,
  resourceUnitEditForm,
  setResourceUnitEditForm,
  createResourceUnitMutation,
  updateResourceUnitMutation,
  deleteResourceUnitMutation,
  deleteUnitFeedbackResourceId,
  isCreatingUnit,
  isCreateResourceUnitValid,
  isEditResourceUnitValid,
  onStartCreateResourceUnit,
  onCancelCreateResourceUnit,
  onCreateResourceUnit,
  onStartEditResourceUnit,
  onCancelEditResourceUnit,
  onSaveResourceUnit,
  onDeleteResourceUnit
}: {
  locale: Locale;
  resource: AdminResourceDetailResponse;
  unitModeOptions: Array<{
    value: "continuous" | "discrete_slot";
    label: string;
  }>;
  editingUnitTarget: { resourceId: string; unitId: string } | null;
  resourceUnitCreateForm: ResourceUnitFormState;
  setResourceUnitCreateForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  resourceUnitEditForm: ResourceUnitFormState;
  setResourceUnitEditForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  createResourceUnitMutation: MutationStateLike;
  updateResourceUnitMutation: MutationStateLike;
  deleteResourceUnitMutation: MutationStateLike;
  deleteUnitFeedbackResourceId: string;
  isCreatingUnit: boolean;
  isCreateResourceUnitValid: boolean;
  isEditResourceUnitValid: boolean;
  onStartCreateResourceUnit: (resourceId: string) => void;
  onCancelCreateResourceUnit: (resourceId: string) => void;
  onCreateResourceUnit: () => void;
  onStartEditResourceUnit: (resourceId: string, unitId: string) => void;
  onCancelEditResourceUnit: (resourceId: string, unitId: string) => void;
  onSaveResourceUnit: () => void;
  onDeleteResourceUnit: (resourceId: string, unitId: string) => void;
}) {
  return (
    <div className="mt-6 border-t border-ink/10 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-ink">
            {localeText(locale, "资源单元", "Resource Units")}
          </h4>
          <p className="mt-2 text-sm leading-7 text-slate">
            {localeText(
              locale,
              "在这里查看、编辑和补充该资源的预约单元。",
              "Review, edit, and add the bookable units for this resource here."
            )}
          </p>
        </div>
        <StatusPill tone={resource.units.length === 0 ? "danger" : "brand"}>
          {resource.units.length === 0
            ? localeText(locale, "未配置单元", "No Units")
            : localeText(locale, `${resource.units.length} 个单元`, `${resource.units.length} units`)}
        </StatusPill>
      </div>

      <div className="mt-4 grid gap-3">
        {resource.units.length === 0 ? (
          <EmptyPanel
            title={localeText(locale, "该资源还没有可预约单元", "This resource has no bookable units yet")}
            description={localeText(
              locale,
              "请先补齐资源单元，再决定是否继续保持资源启用。",
              "Add at least one unit before deciding whether the resource should stay active."
            )}
          />
        ) : null}

        {resource.units.map((unit) => (
          <ResourceUnitCard
            key={unit.id}
            locale={locale}
            resourceId={resource.id}
            unit={unit}
            unitModeOptions={unitModeOptions}
            isEditing={
              editingUnitTarget?.resourceId === resource.id &&
              editingUnitTarget?.unitId === unit.id
            }
            resourceUnitEditForm={resourceUnitEditForm}
            setResourceUnitEditForm={setResourceUnitEditForm}
            updateResourceUnitMutation={updateResourceUnitMutation}
            deleteResourceUnitMutation={deleteResourceUnitMutation}
            isEditResourceUnitValid={isEditResourceUnitValid}
            onStartEditResourceUnit={onStartEditResourceUnit}
            onCancelEditResourceUnit={onCancelEditResourceUnit}
            onSaveResourceUnit={onSaveResourceUnit}
            onDeleteResourceUnit={onDeleteResourceUnit}
          />
        ))}

        {isCreatingUnit ? (
          <form
            className="rounded-[24px] border border-dashed border-moss/25 bg-white px-4 py-4"
            onSubmit={(event) => {
              event.preventDefault();
              onCreateResourceUnit();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ResourceUnitFields
                locale={locale}
                form={resourceUnitCreateForm}
                setForm={setResourceUnitCreateForm}
                availabilityOptions={unitModeOptions}
              />
            </div>
            <MutationState
              mutation={createResourceUnitMutation}
              pending={localeText(locale, "正在创建资源单元。", "Creating resource unit.")}
              success={localeText(locale, "资源单元已创建。", "Resource unit created.")}
              formatError={(error) => formatResourceMutationError(error, locale)}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-full bg-moss px-5 py-3 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:bg-moss/50"
                disabled={!isCreateResourceUnitValid || createResourceUnitMutation.isPending}
              >
                {createResourceUnitMutation.isPending
                  ? localeText(locale, "创建中", "Creating")
                  : localeText(locale, "创建资源单元", "Create Resource Unit")}
              </button>
              <button
                type="button"
                className="rounded-full border border-ink/10 px-5 py-3 text-sm text-ink transition hover:border-moss hover:text-moss"
                onClick={() => onCancelCreateResourceUnit(resource.id)}
              >
                {localeText(locale, "取消", "Cancel")}
              </button>
            </div>
          </form>
        ) : (
          <DashedActionCard
            title={localeText(locale, "新增资源单元", "Add Resource Unit")}
            description={localeText(
              locale,
              "在当前资源卡片内直接补齐房间、场地或其他预约单元。",
              "Add rooms, courts, or other bookable units directly inside the current resource card."
            )}
            buttonLabel={localeText(locale, "新增资源单元", "Add Resource Unit")}
            onClick={() => onStartCreateResourceUnit(resource.id)}
          />
        )}
      </div>

      {deleteUnitFeedbackResourceId === resource.id ? (
        <MutationState
          mutation={deleteResourceUnitMutation}
          pending={localeText(locale, "正在删除资源单元。", "Deleting resource unit.")}
          success={localeText(locale, "资源单元已删除。", "Resource unit deleted.")}
          formatError={(error) => formatResourceMutationError(error, locale)}
        />
      ) : null}
    </div>
  );
}

function ResourceUnitCard({
  locale,
  resourceId,
  unit,
  unitModeOptions,
  isEditing,
  resourceUnitEditForm,
  setResourceUnitEditForm,
  updateResourceUnitMutation,
  deleteResourceUnitMutation,
  isEditResourceUnitValid,
  onStartEditResourceUnit,
  onCancelEditResourceUnit,
  onSaveResourceUnit,
  onDeleteResourceUnit
}: {
  locale: Locale;
  resourceId: string;
  unit: AdminResourceDetailResponse["units"][number];
  unitModeOptions: Array<{
    value: "continuous" | "discrete_slot";
    label: string;
  }>;
  isEditing: boolean;
  resourceUnitEditForm: ResourceUnitFormState;
  setResourceUnitEditForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  updateResourceUnitMutation: MutationStateLike;
  deleteResourceUnitMutation: MutationStateLike;
  isEditResourceUnitValid: boolean;
  onStartEditResourceUnit: (resourceId: string, unitId: string) => void;
  onCancelEditResourceUnit: (resourceId: string, unitId: string) => void;
  onSaveResourceUnit: () => void;
  onDeleteResourceUnit: (resourceId: string, unitId: string) => void;
}) {
  if (isEditing) {
    return (
      <form
        className="rounded-[24px] border border-ember/18 bg-ember/5 px-4 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSaveResourceUnit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ResourceUnitFields
            locale={locale}
            form={resourceUnitEditForm}
            setForm={setResourceUnitEditForm}
            availabilityOptions={unitModeOptions}
          />
        </div>
        <MutationState
          mutation={updateResourceUnitMutation}
          pending={localeText(locale, "正在保存资源单元修改。", "Saving unit changes.")}
          success={localeText(locale, "资源单元信息已更新。", "Resource unit updated.")}
          formatError={(error) => formatResourceMutationError(error, locale)}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-full bg-navy px-5 py-3 text-sm font-medium text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-navy/50"
            disabled={!isEditResourceUnitValid || updateResourceUnitMutation.isPending}
          >
            {updateResourceUnitMutation.isPending
              ? localeText(locale, "保存中", "Saving")
              : localeText(locale, "保存单元修改", "Save Unit Changes")}
          </button>
          <button
            type="button"
            className="rounded-full border border-ink/10 px-5 py-3 text-sm text-ink transition hover:border-moss hover:text-moss"
            onClick={() => onCancelEditResourceUnit(resourceId, unit.id)}
          >
            {localeText(locale, "取消", "Cancel")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-[24px] border border-ink/10 bg-sand px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{unit.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink/45">{unit.code}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-moss/20 px-3 py-1 text-xs text-moss transition hover:bg-moss/10"
            onClick={() => onStartEditResourceUnit(resourceId, unit.id)}
          >
            {localeText(locale, "编辑", "Edit")}
          </button>
          <button
            type="button"
            className="rounded-full border border-danger/20 px-3 py-1 text-xs text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onDeleteResourceUnit(resourceId, unit.id)}
            disabled={deleteResourceUnitMutation.isPending}
          >
            {localeText(locale, "删除", "Delete")}
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill tone="brand">{unit.unitType}</StatusPill>
        <StatusPill tone="neutral">{availabilityModeLabel(unit.availabilityMode, locale)}</StatusPill>
        <StatusPill tone="success">
          {localeText(locale, `容量 ${unit.capacity ?? 1}`, `Capacity ${unit.capacity ?? 1}`)}
        </StatusPill>
      </div>
    </div>
  );
}

function DashedActionCard({
  title,
  description,
  buttonLabel,
  onClick
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-[26px] border border-dashed border-ink/15 bg-sand px-5 py-5">
      <p className="text-lg font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate">{description}</p>
      <button
        type="button"
        className="mt-4 rounded-full border border-moss/25 px-4 py-2 text-sm text-moss transition hover:bg-white"
        onClick={onClick}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function InlineInfoCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-sand px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function ResourceFields({
  locale,
  form,
  setForm
}: {
  locale: Locale;
  form: ResourceFormState;
  setForm: Dispatch<SetStateAction<ResourceFormState>>;
}) {
  return (
    <>
      <FieldBlock
        label={localeText(locale, "资源编码", "Resource Code")}
        hint={localeText(
          locale,
          "使用稳定且唯一的业务编码，例如 E1-INNOVATION-01 或 SPORT-BADMINTON-A。",
          "Use a stable and unique business code, such as E1-INNOVATION-01 or SPORT-BADMINTON-A."
        )}
      >
        <input
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
          value={form.code}
          onChange={(event) =>
            setForm((current) => ({
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
          "资源名称应直接对应学生会看到的空间或场馆名称，不要只写内部简称。",
          "Use the student-facing name for the space or venue instead of an internal shorthand."
        )}
      >
        <input
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({
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
          "位置建议写到楼栋、楼层或场馆区域粒度，便于学生理解和管理员检索。",
          "Describe the location at building, floor, or venue-area granularity for both students and admins."
        )}
      >
        <input
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
          value={form.location}
          onChange={(event) =>
            setForm((current) => ({
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
          "描述可补充用途、设备、适用人数或使用提醒，让资源信息在前端展示时更完整。",
          "Use the description for purpose, equipment, capacity, or usage notes so the resource looks complete on the frontend."
        )}
      >
        <textarea
          className="min-h-[96px] rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value
            }))
          }
          placeholder={localeText(locale, "描述", "Description")}
        />
      </FieldBlock>
    </>
  );
}

function ResourceUnitFields({
  locale,
  form,
  setForm,
  availabilityOptions
}: {
  locale: Locale;
  form: ResourceUnitFormState;
  setForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  availabilityOptions: Array<{
    value: ResourceUnitFormState["availabilityMode"];
    label: string;
  }>;
}) {
  return (
    <>
      <FieldBlock
        label={localeText(locale, "单元编码", "Unit Code")}
        hint={localeText(
          locale,
          "单元编码应在同一资源下保持唯一，适合写房间号、场地号等可定位编号。",
          "Keep the unit code unique within the same resource. Room numbers and court numbers work well here."
        )}
      >
        <input
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
          value={form.code}
          onChange={(event) =>
            setForm((current) => ({
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
          "名称建议与现场门牌、场地编号或预约对象名称一致。",
          "Keep the unit name aligned with door labels, court numbers, or the actual booking target."
        )}
      >
        <input
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({
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
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
          value={form.unitType}
          onChange={(event) =>
            setForm((current) => ({
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
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
          value={form.availabilityMode}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              availabilityMode: event.target.value as ResourceUnitFormState["availabilityMode"]
            }))
          }
        >
          {availabilityOptions.map((option) => (
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
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
          type="number"
          min={1}
          value={form.capacity}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              capacity: Number(event.target.value)
            }))
          }
          placeholder={localeText(locale, "容量", "Capacity")}
        />
      </FieldBlock>
    </>
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
