import type { Dispatch, SetStateAction } from "react";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { MutationState } from "../../components/mutation-state";
import { ActivityFieldBlock } from "./activity-field-block";
import type {
  ActivityFormState,
  FirstTicketFormState
} from "./activities-workspace-helpers";

type MutationStateLike = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
};

function FirstTicketCard({
  locale,
  customizeFirstTicket,
  setCustomizeFirstTicket,
  firstTicketForm,
  setFirstTicketForm,
  effectiveFirstTicket,
  onResetDefault
}: {
  locale: Locale;
  customizeFirstTicket: boolean;
  setCustomizeFirstTicket: Dispatch<SetStateAction<boolean>>;
  firstTicketForm: FirstTicketFormState;
  setFirstTicketForm: Dispatch<SetStateAction<FirstTicketFormState>>;
  effectiveFirstTicket: FirstTicketFormState;
  onResetDefault: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-navy/10 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">
            {localeText(locale, "默认首个票种", "Default First Ticket")}
          </p>
          <p className="mt-2 text-sm text-slate">
            {localeText(
              locale,
              `${effectiveFirstTicket.name} · 库存 ${effectiveFirstTicket.stock} · ${effectiveFirstTicket.priceCents === 0 ? "免费" : `¥${(effectiveFirstTicket.priceCents / 100).toFixed(2)}`}`,
              `${effectiveFirstTicket.name} · Stock ${effectiveFirstTicket.stock} · ${effectiveFirstTicket.priceCents === 0 ? "Free" : `¥${(effectiveFirstTicket.priceCents / 100).toFixed(2)}`}`
            )}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
          onClick={() =>
            setCustomizeFirstTicket((current) => {
              const next = !current;

              if (next) {
                onResetDefault();
              }

              return next;
            })
          }
        >
          {customizeFirstTicket
            ? localeText(locale, "恢复默认票种", "Use Default Ticket")
            : localeText(locale, "自定义首个票种", "Customize First Ticket")}
        </button>
      </div>

      {customizeFirstTicket ? (
        <div className="mt-4 grid gap-4">
          <ActivityFieldBlock
            label={localeText(locale, "首个票种名称", "First Ticket Name")}
            hint={localeText(
              locale,
              "名称会直接展示给学生，建议写成“普通票”“入场票”等能直接理解的叫法。",
              "This name is shown directly to students, so prefer clear labels such as General Ticket or Entry Ticket."
            )}
          >
            <input
              className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={firstTicketForm.name}
              onChange={(event) =>
                setFirstTicketForm((current) => ({
                  ...current,
                  name: event.target.value
                }))
              }
              placeholder={localeText(locale, "首个票种名称", "First ticket type")}
            />
          </ActivityFieldBlock>
          <div className="grid gap-4 sm:grid-cols-2">
            <ActivityFieldBlock
              label={localeText(locale, "首票库存", "First Ticket Stock")}
              hint={localeText(
                locale,
                "库存决定第一张票能卖多少张，若不需要分票种，通常与总额度保持一致。",
                "This determines how many tickets the first ticket type can sell. If you do not split types, it usually matches the total quota."
              )}
            >
              <input
                className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                type="number"
                min={1}
                value={firstTicketForm.stock}
                onChange={(event) =>
                  setFirstTicketForm((current) => ({
                    ...current,
                    stock: Number(event.target.value)
                  }))
                }
                placeholder={localeText(locale, "票数", "Ticket stock")}
              />
            </ActivityFieldBlock>
            <ActivityFieldBlock
              label={localeText(locale, "首票价格（分）", "First Ticket Price (cents)")}
              hint={localeText(
                locale,
                "价格字段以分为单位，`0` 表示免费票。",
                "The price is stored in cents, and `0` means the ticket is free."
              )}
            >
              <input
                className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                type="number"
                min={0}
                value={firstTicketForm.priceCents}
                onChange={(event) =>
                  setFirstTicketForm((current) => ({
                    ...current,
                    priceCents: Number(event.target.value)
                  }))
                }
                placeholder={localeText(locale, "价格分", "Price in cents")}
              />
            </ActivityFieldBlock>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdvancedSettingsCard({
  locale,
  showAdvancedSettings,
  setShowAdvancedSettings,
  activityForm,
  setActivityForm
}: {
  locale: Locale;
  showAdvancedSettings: boolean;
  setShowAdvancedSettings: Dispatch<SetStateAction<boolean>>;
  activityForm: ActivityFormState;
  setActivityForm: Dispatch<SetStateAction<ActivityFormState>>;
}) {
  return (
    <div className="rounded-[22px] border border-navy/10 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">
            {localeText(locale, "进阶设置", "Advanced Settings")}
          </p>
          <p className="mt-2 text-sm text-slate">
            {localeText(
              locale,
              "可继续补充描述、售卖时间、活动时间和发布状态。",
              "Use this section for description, schedule, event time, and publish status."
            )}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
          onClick={() => setShowAdvancedSettings((current) => !current)}
          aria-expanded={showAdvancedSettings}
        >
          {showAdvancedSettings
            ? localeText(locale, "收起进阶设置", "Hide Advanced Settings")
            : localeText(locale, "展开进阶设置", "Show Advanced Settings")}
        </button>
      </div>

      {showAdvancedSettings ? (
        <div className="mt-4 grid gap-4">
          <ActivityFieldBlock
            label={localeText(locale, "活动描述", "Description")}
            hint={localeText(
              locale,
              "描述适合补充议程、适用对象、注意事项或报名说明。",
              "Use the description for agenda, target audience, notes, or registration guidance."
            )}
          >
            <textarea
              className="min-h-[96px] rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={activityForm.description}
              onChange={(event) =>
                setActivityForm((current) => ({
                  ...current,
                  description: event.target.value
                }))
              }
              placeholder={localeText(locale, "活动描述", "Description")}
            />
          </ActivityFieldBlock>
          <ActivityFieldBlock
            label={localeText(locale, "发布状态", "Publish Status")}
            hint={localeText(
              locale,
              "默认保持草稿更安全；确认信息完整后再直接创建为已发布状态。",
              "Keeping the activity as a draft is safer by default. Publish only after the core information is complete."
            )}
          >
            <select
              className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={activityForm.status}
              onChange={(event) =>
                setActivityForm((current) => ({
                  ...current,
                  status: event.target.value as "draft" | "published"
                }))
              }
            >
              <option value="draft">{localeText(locale, "草稿", "Draft")}</option>
              <option value="published">{localeText(locale, "已发布", "Published")}</option>
            </select>
          </ActivityFieldBlock>
          <div className="grid gap-4 sm:grid-cols-2">
            <ActivityFieldBlock
              label={localeText(locale, "售卖开始时间", "Sales Start Time")}
              hint={localeText(
                locale,
                "这是学生最早可以开始抢票或报名的时间。",
                "This is the earliest time when students can start buying or registering."
              )}
            >
              <input
                className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                type="datetime-local"
                value={activityForm.saleStartTime}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    saleStartTime: event.target.value
                  }))
                }
              />
            </ActivityFieldBlock>
            <ActivityFieldBlock
              label={localeText(locale, "售卖结束时间", "Sales End Time")}
              hint={localeText(
                locale,
                "超过这个时间后，前端不应继续允许学生下单。",
                "Students should no longer be able to place orders after this time."
              )}
            >
              <input
                className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                type="datetime-local"
                value={activityForm.saleEndTime}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    saleEndTime: event.target.value
                  }))
                }
              />
            </ActivityFieldBlock>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ActivityFieldBlock
              label={localeText(locale, "活动开始时间", "Event Start Time")}
              hint={localeText(
                locale,
                "用于告诉学生活动何时正式开始，也影响详情页的时间展示。",
                "This tells students when the activity starts and affects the detail page schedule display."
              )}
            >
              <input
                className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                type="datetime-local"
                value={activityForm.eventStartTime}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    eventStartTime: event.target.value
                  }))
                }
              />
            </ActivityFieldBlock>
            <ActivityFieldBlock
              label={localeText(locale, "活动结束时间", "Event End Time")}
              hint={localeText(
                locale,
                "用于形成完整活动时间范围，便于后续通知、详情和回溯展示。",
                "This completes the activity time range for notices, details, and historical review."
              )}
            >
              <input
                className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                type="datetime-local"
                value={activityForm.eventEndTime}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    eventEndTime: event.target.value
                  }))
                }
              />
            </ActivityFieldBlock>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CreateActivityPanel({
  locale,
  activityForm,
  setActivityForm,
  customizeFirstTicket,
  setCustomizeFirstTicket,
  firstTicketForm,
  setFirstTicketForm,
  effectiveFirstTicket,
  showAdvancedSettings,
  setShowAdvancedSettings,
  isValid,
  mutation,
  onSubmit,
  onResetFirstTicket
}: {
  locale: Locale;
  activityForm: ActivityFormState;
  setActivityForm: Dispatch<SetStateAction<ActivityFormState>>;
  customizeFirstTicket: boolean;
  setCustomizeFirstTicket: Dispatch<SetStateAction<boolean>>;
  firstTicketForm: FirstTicketFormState;
  setFirstTicketForm: Dispatch<SetStateAction<FirstTicketFormState>>;
  effectiveFirstTicket: FirstTicketFormState;
  showAdvancedSettings: boolean;
  setShowAdvancedSettings: Dispatch<SetStateAction<boolean>>;
  isValid: boolean;
  mutation: MutationStateLike;
  onSubmit: () => void;
  onResetFirstTicket: () => void;
}) {
  return (
    <form
      className="rounded-[24px] border border-ink/10 bg-mist px-5 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h3 className="text-lg font-semibold text-ink">
        {localeText(locale, "新增活动", "Create Activity")}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate">
        {localeText(
          locale,
          "填写活动名称、地点和额度后即可创建活动，也可以继续补充票种和时间安排。",
          "Start with the activity title, location, and quota, then continue with ticket and schedule details."
        )}
      </p>
      <div className="mt-4 grid gap-4">
        <ActivityFieldBlock
          label={localeText(locale, "活动标题", "Activity Title")}
          hint={localeText(
            locale,
            "标题是列表和详情页里最先被看到的信息，建议直接表达活动主题。",
            "The title is the first thing shown in both the list and details, so make the activity topic immediately clear."
          )}
        >
          <input
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={activityForm.title}
            onChange={(event) =>
              setActivityForm((current) => ({
                ...current,
                title: event.target.value
              }))
            }
            placeholder={localeText(locale, "活动标题", "Activity title")}
          />
        </ActivityFieldBlock>
        <ActivityFieldBlock
          label={localeText(locale, "活动地点", "Location")}
          hint={localeText(
            locale,
            "地点建议写到学生能直接找到的粒度，例如教学楼房间、球场区域或报告厅名称。",
            "Use a student-facing location such as a room, court area, or auditorium name."
          )}
        >
          <input
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={activityForm.location}
            onChange={(event) =>
              setActivityForm((current) => ({
                ...current,
                location: event.target.value
              }))
            }
            placeholder={localeText(locale, "活动地点", "Location")}
          />
        </ActivityFieldBlock>
        <ActivityFieldBlock
          label={localeText(locale, "总额度", "Total Quota")}
          hint={localeText(
            locale,
            "总额度决定默认首票库存，也影响活动详情页展示。若只是单票活动，通常可以与首票库存保持一致。",
            "The total quota determines the default first-ticket stock and is shown on the activity details page. For a single-ticket activity, it usually matches the first ticket stock."
          )}
        >
          <input
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            type="number"
            min={1}
            value={activityForm.totalQuota}
            onChange={(event) =>
              setActivityForm((current) => ({
                ...current,
                totalQuota: Number(event.target.value)
              }))
            }
            placeholder={localeText(locale, "总额度", "Total quota")}
          />
        </ActivityFieldBlock>

        <FirstTicketCard
          locale={locale}
          customizeFirstTicket={customizeFirstTicket}
          setCustomizeFirstTicket={setCustomizeFirstTicket}
          firstTicketForm={firstTicketForm}
          setFirstTicketForm={setFirstTicketForm}
          effectiveFirstTicket={effectiveFirstTicket}
          onResetDefault={onResetFirstTicket}
        />

        <AdvancedSettingsCard
          locale={locale}
          showAdvancedSettings={showAdvancedSettings}
          setShowAdvancedSettings={setShowAdvancedSettings}
          activityForm={activityForm}
          setActivityForm={setActivityForm}
        />
      </div>
      <MutationState
        mutation={mutation}
        success={localeText(locale, "活动已创建。", "Activity created.")}
      />
      <button
        type="submit"
        className="mt-4 w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
        disabled={!isValid || mutation.isPending}
      >
        {mutation.isPending
          ? localeText(locale, "创建中", "Creating")
          : localeText(locale, "创建活动", "Create Activity")}
      </button>
    </form>
  );
}
