import type { AppNotification } from "@campusbook/shared-types";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { fetchPublishedNotifications } from "../../lib/api/notification-api";
import { formatDateTime } from "../../lib/date";
import { getErrorMessage } from "../../lib/http/errors";
import { localeText } from "../../lib/locale";
import type { Locale } from "../../store/locale-store";
import { EmptyPanel, StatePanel } from "../user-experience-kit";

type HomeNotificationsSectionProps = {
  actionLabelEn: string;
  actionLabelZh: string;
  actionTo: string;
  locale: Locale;
};

export function HomeNotificationsSection({
  actionLabelEn,
  actionLabelZh,
  actionTo,
  locale
}: HomeNotificationsSectionProps) {
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "published"],
    queryFn: fetchPublishedNotifications
  });

  return (
    <section className="rounded-[30px] border border-navy/10 bg-white px-6 py-6 shadow-panel lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-moss">
            {localeText(locale, "首页通知", "Home Notices")}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-ink">
            {localeText(locale, "最新通知", "Latest Notices")}
          </h3>
        </div>
        <Link
          to={actionTo}
          className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
        >
          {localeText(locale, actionLabelZh, actionLabelEn)}
        </Link>
      </div>

      <div className="mt-5">
        {notificationsQuery.isLoading ? (
          <StatePanel
            tone="loading"
            title={localeText(locale, "正在载入通知", "Loading notices")}
            description={localeText(locale, "请稍候。", "Please wait.")}
          />
        ) : notificationsQuery.isError ? (
          <StatePanel
            tone="danger"
            title={localeText(locale, "通知暂时无法加载", "Notices are unavailable")}
            description={getErrorMessage(notificationsQuery.error)}
          />
        ) : !notificationsQuery.data?.length ? (
          <EmptyPanel
            title={localeText(locale, "当前没有通知", "No notices yet")}
            description={localeText(
              locale,
              "管理员发布后的通知会显示在这里。",
              "Published admin notices will appear here."
            )}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {notificationsQuery.data.slice(0, 3).map((notification) => (
              <NotificationPreviewCard
                key={notification.id}
                locale={locale}
                notification={notification}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NotificationPreviewCard({
  locale,
  notification
}: {
  locale: Locale;
  notification: AppNotification;
}) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-navy/10 bg-sand">
      {notification.imageUrl ? (
        <img
          src={notification.imageUrl}
          alt={notification.title}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="px-5 py-5">
        <p className="text-xs uppercase tracking-[0.2em] text-moss">
          {notification.publishedAt
            ? formatDateTime(notification.publishedAt)
            : localeText(locale, "待发布", "Draft")}
        </p>
        <h4 className="mt-3 text-lg font-semibold text-ink">{notification.title}</h4>
        <p className="mt-3 text-sm leading-7 text-slate">
          {notification.summary || notification.content}
        </p>
      </div>
    </article>
  );
}
