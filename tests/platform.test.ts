import { describe, expect, it } from "vitest";
import { isMemoryConstrainedIOSBrowser } from "../src/lib/platform";

const SAFARI_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const FIREFOX_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/126.0 Mobile/15E148 Safari/605.1.15";
const CHROME_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1";
const FIREFOX_DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0";
const CHROME_ANDROID = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

describe("isMemoryConstrainedIOSBrowser", () => {
  it("is false for Safari on iPhone (the system browser, higher memory budget)", () => {
    expect(isMemoryConstrainedIOSBrowser(SAFARI_IOS)).toBe(false);
  });

  it("is true for Firefox on iPhone (WKWebView wrapper, tighter memory budget)", () => {
    expect(isMemoryConstrainedIOSBrowser(FIREFOX_IOS)).toBe(true);
  });

  it("is true for Chrome on iPhone (also a WKWebView wrapper)", () => {
    expect(isMemoryConstrainedIOSBrowser(CHROME_IOS)).toBe(true);
  });

  it("is false for Firefox on desktop", () => {
    expect(isMemoryConstrainedIOSBrowser(FIREFOX_DESKTOP)).toBe(false);
  });

  it("is false for Chrome on Android (not iOS at all)", () => {
    expect(isMemoryConstrainedIOSBrowser(CHROME_ANDROID)).toBe(false);
  });
});
