import { defineConfig } from "astro/config";
import { SITE_URL } from "./src/data/site.ts";

export default defineConfig({
  site: SITE_URL,
  // A block of code in an article takes the colors of a dark widget of the app from its styles, so the Markdown of
  // the articles gets no colors of its own.
  markdown: {
    syntaxHighlight: false,
  },
});
