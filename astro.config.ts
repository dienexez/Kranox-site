import { defineConfig } from "astro/config";
import { SITE_URL } from "./src/data/site.ts";

export default defineConfig({
  site: SITE_URL,
});
