import eslint from "@eslint/js";
import astro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["dist/", ".astro/"]),
  eslint.configs.recommended,
  tseslint.configs.strict,
  astro.configs.recommended,
);
