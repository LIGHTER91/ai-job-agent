import type { ConsentSettings, LocalAnalyticsRecord } from "../../../types";
import { createLocalId, getDb, nowIso } from "../../storage/db";
import type { AnalyticsEvent } from "../events";

export async function trackLocalAnalytics(event: AnalyticsEvent, consent: ConsentSettings): Promise<void> {
  if (!consent.anonymousAnalytics || !consent.localHistory) return;
  const record: LocalAnalyticsRecord = {
    id: createLocalId("event"),
    createdAt: nowIso(),
    event,
  };
  const db = await getDb();
  await db.put("localAnalyticsEvents", record);
}
