import eslint from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";
import userscripts from "eslint-plugin-userscripts";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  globalIgnores(["libby-availability-adguard.user.js"]),
  eslint.configs.recommended,
  {
    name: "all js",
    files: ["*.js", "*.mjs"],
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "prefer-spread": 1,
      "no-var": 2,
      "prefer-const": 2,
      "@stylistic/no-tabs": [2],
      "@stylistic/indent": [1, 2, {"offsetTernaryExpressions": true}],
    }
  },
  {
    name: "eslint config file",
    files: ["eslint.config.mjs"],
  },
  {
    name: "usescript files",
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
      "userscripts/better-use-match": 1,
      "@stylistic/brace-style": [1, "1tbs", { "allowSingleLine": true }],
    },
    settings: {
      userscriptVersions: {
        violentmonkey: "*",
        adguard: "*",
      },
    },
  },
]);
