// Every iOS browser (Firefox, Chrome, Edge, etc.) runs on the same WebKit engine as Safari,
// but as third-party apps they get a much smaller memory allowance from iOS than Safari itself
// gets as the system browser. Loading + running an on-device ONNX speech model can exceed that
// tighter budget and get the whole process killed by the OS (jetsam) -- not something JS can
// catch or recover from. Detect that risky combination so callers can decline gracefully instead
// of crashing (confirmed: works fine in Safari, crashes/closes in Firefox for iPhone, 2026-07-20).
export function isMemoryConstrainedIOSBrowser(userAgent = navigator.userAgent): boolean {
  const isIOS = /iPhone|iPad|iPod/.test(userAgent);
  const isThirdPartyWrapper = /FxiOS|CriOS|EdgiOS|OPiOS|mercury/i.test(userAgent);
  return isIOS && isThirdPartyWrapper;
}
