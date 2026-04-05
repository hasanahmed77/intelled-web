"use server";

import { requireUser } from "@/lib/auth";
import {
  listUserNotifications,
  markAllNotificationsRead
} from "@/lib/notifications/data";

export async function listNotificationsAction() {
  const user = await requireUser();
  return listUserNotifications(user.id);
}

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await markAllNotificationsRead(user.id);
  return { ok: true };
}
