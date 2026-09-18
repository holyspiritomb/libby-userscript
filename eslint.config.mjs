import eslint from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import userscripts from "eslint-plugin-userscripts";

export default defineConfig([
  eslint.configs.recommended,
  {
    files: ["eslint.config.mjs"],
    languageOptions: {
      sourceType: "module",
    },
  },
  {
    files: ["*.user.js"],
    plugins: {
      userscripts: {
        rules: userscripts.rules,
      },
    },
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        ...globals.greasemonkey,
      },
    },
    rules: {
      ...userscripts.configs.recommended.rules,
      "userscripts/compat-grant": 1,
    },
    settings: {
      userscriptVersions: {
        violentmonkey: "*",
        adguard: "*",
      },
    },
  },
]);
