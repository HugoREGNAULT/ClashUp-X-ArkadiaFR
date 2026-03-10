import path from "path";
import { readJsonFile, writeJsonFile } from "./jsonStore.js";

const REMINDERS_FILE = path.join(process.cwd(), "data", "reminders.json");

export function getAllReminders() {
  return readJsonFile(REMINDERS_FILE, []);
}

export function saveAllReminders(reminders) {
  writeJsonFile(REMINDERS_FILE, reminders);
}

export function addReminder(reminder) {
  const reminders = getAllReminders();
  reminders.push(reminder);
  saveAllReminders(reminders);
  return reminder;
}

export function removeReminderById(reminderId) {
  const reminders = getAllReminders();
  const updated = reminders.filter((reminder) => reminder.id !== reminderId);
  saveAllReminders(updated);
}

export function getDueReminders(nowUnixSeconds) {
  const reminders = getAllReminders();
  return reminders.filter(
    (reminder) => Number(reminder.remindAt) <= nowUnixSeconds
  );
}