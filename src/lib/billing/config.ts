export function isManualBillingEnabled() {
  return process.env.ENABLE_MANUAL_BILLING === "true";
}
