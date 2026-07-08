import type { AnalyticsEvent } from "../events";

export function trackConsoleAnalytics(event: AnalyticsEvent): void {
  if (import.meta.env.DEV) {
    console.info("[AI Job Matcher analytics]", event);
  }
}
