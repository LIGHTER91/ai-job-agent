import type { ConsentSettings } from "../../../types";
import type { AnalyticsEvent } from "../events";

export async function trackExternalAnalytics(_event: AnalyticsEvent, _consent: ConsentSettings): Promise<void> {
  // Stub for an explicitly configured privacy-friendly provider.
}
