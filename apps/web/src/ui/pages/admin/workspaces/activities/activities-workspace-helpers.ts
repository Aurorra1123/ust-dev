import type { ActivityDetailResponse } from "@campusbook/shared-types";

import type { CreateActivityPayload } from "../../../../../lib/api/activity-api";
import {
  addHours,
  startOfNextHour,
  toDateTimeLocalValue
} from "../../../../../lib/date";
import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";

export type ActivityFormState = {
  title: string;
  description: string;
  location: string;
  totalQuota: number;
  saleStartTime: string;
  saleEndTime: string;
  eventStartTime: string;
  eventEndTime: string;
  status: "draft" | "published";
};

export type FirstTicketFormState = {
  name: string;
  stock: number;
  priceCents: number;
};

export type TicketFormState = {
  name: string;
  stock: number;
  priceCents: number;
};

export function createDefaultActivityForm(): ActivityFormState {
  const saleStart = startOfNextHour();
  const saleEnd = addHours(saleStart, 24);
  const eventStart = addHours(saleStart, 26);
  const eventEnd = addHours(eventStart, 2);

  return {
    title: "",
    description: "",
    location: "",
    totalQuota: 30,
    saleStartTime: toDateTimeLocalValue(saleStart),
    saleEndTime: toDateTimeLocalValue(saleEnd),
    eventStartTime: toDateTimeLocalValue(eventStart),
    eventEndTime: toDateTimeLocalValue(eventEnd),
    status: "draft"
  };
}

export function defaultFirstTicketName(locale: Locale) {
  return localeText(locale, "普通票", "General Ticket");
}

export function createDefaultFirstTicketForm(
  totalQuota: number,
  locale: Locale
): FirstTicketFormState {
  return {
    name: defaultFirstTicketName(locale),
    stock: totalQuota,
    priceCents: 0
  };
}

export function createDefaultTicketForm(): TicketFormState {
  return {
    name: "",
    stock: 10,
    priceCents: 0
  };
}

export function getSelectedActivity(
  activities: ActivityDetailResponse[] | undefined,
  activityId: string
) {
  return activities?.find((activity) => activity.id === activityId) ?? activities?.[0] ?? null;
}

export function resolveEffectiveFirstTicket(
  activityForm: ActivityFormState,
  locale: Locale,
  customizeFirstTicket: boolean,
  firstTicketForm: FirstTicketFormState
) {
  return customizeFirstTicket
    ? firstTicketForm
    : createDefaultFirstTicketForm(activityForm.totalQuota, locale);
}

export function validateCreateActivityForm(
  activityForm: ActivityFormState,
  firstTicketForm: FirstTicketFormState
) {
  return (
    activityForm.title.trim().length > 0 &&
    activityForm.totalQuota > 0 &&
    firstTicketForm.name.trim().length > 0 &&
    firstTicketForm.stock > 0 &&
    firstTicketForm.priceCents >= 0
  );
}

export function validateCreateTicketForm(
  selectedActivity: ActivityDetailResponse | null,
  ticketForm: TicketFormState
) {
  return (
    Boolean(selectedActivity) &&
    ticketForm.name.trim().length > 0 &&
    ticketForm.stock > 0 &&
    ticketForm.priceCents >= 0
  );
}

export function buildCreateActivityPayload(
  activityForm: ActivityFormState,
  firstTicketForm: FirstTicketFormState
): CreateActivityPayload {
  return {
    title: activityForm.title.trim(),
    description: activityForm.description.trim() || undefined,
    location: activityForm.location.trim() || undefined,
    totalQuota: activityForm.totalQuota,
    saleStartTime: new Date(activityForm.saleStartTime).toISOString(),
    saleEndTime: new Date(activityForm.saleEndTime).toISOString(),
    eventStartTime: new Date(activityForm.eventStartTime).toISOString(),
    eventEndTime: new Date(activityForm.eventEndTime).toISOString(),
    status: activityForm.status,
    tickets: [
      {
        name: firstTicketForm.name.trim(),
        stock: firstTicketForm.stock,
        priceCents: firstTicketForm.priceCents
      }
    ]
  };
}

export function buildCreateTicketPayload(
  activityId: string,
  ticketForm: TicketFormState
): { activityId: string; name: string; stock: number; priceCents: number } {
  return {
    activityId,
    name: ticketForm.name.trim(),
    stock: ticketForm.stock,
    priceCents: ticketForm.priceCents
  };
}
