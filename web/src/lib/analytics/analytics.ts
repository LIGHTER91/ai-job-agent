import type { ConsentSettings } from "../../types";
import type { AnalyticsEvent } from "./events";
import { trackConsoleAnalytics } from "./providers/consoleAnalytics";
import { trackExternalAnalytics } from "./providers/externalAnalytics";
import { trackLocalAnalytics } from "./providers/localAnalytics";

export async function trackAnalytics(event: AnalyticsEvent, consent: ConsentSettings): Promise<void> {
  if (!consent.anonymousAnalytics) return;
  trackConsoleAnalytics(event);
  await trackLocalAnalytics(event, consent);
  await trackExternalAnalytics(event, consent);
}
