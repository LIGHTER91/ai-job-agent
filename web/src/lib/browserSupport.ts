export function hasWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function browserSupportMessage(): string {
  if (hasWebGPU()) {
    return "WebGPU detected. Local inference can run in this browser.";
  }
  return "WebGPU is not available. The dashboard will use rule-based fallback text.";
}
