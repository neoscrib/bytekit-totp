import {defineConfig} from "vitest/config";
import {playwright} from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    name: "browser",
    globals: true,
    include: ["test/**/*.browser.test.ts"],
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: {
          headless: true
        }
      }),
      instances: [{browser: "chromium"}]
    }
  }
});
