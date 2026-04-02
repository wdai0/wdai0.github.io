import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://wdai0.github.io",
  output: "static",
  build: {
    format: "directory"
  },
  markdown: {
    shikiConfig: {
      theme: "github-light"
    }
  }
});
