import eslint from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";
import greasemonkey from "eslint-plugin-greasemonkey";

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
    name: "main script",
    files: ["libby-availability.user.js"],
    plugins: {
      greasemonkey,
    },
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        ...globals.greasemonkey,
      },
    },
    rules: {
      ...greasemonkey.configs.violentmonkey.rules,
      "greasemonkey/no-unused-grants": "off", // "unused" grants are required for GM_config
      // "greasemonkey/meta-spacing": ["warn", { "spaces": 2 }],
      "greasemonkey/meta-spacing": "off",
      "@stylistic/brace-style": [1, "1tbs", { "allowSingleLine": true }],
      "@stylistic/keyword-spacing": [1],
      "@stylistic/no-trailing-spaces": [1],
    },
    settings: {
      userscriptVersions: {
        violentmonkey: "*",
        adguard: "*",
      },
    },
  },
  {
    name: "adguard script",
    files: ["libby-availability-adguard.user.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        ...globals.greasemonkey,
      },
    },
    rules: {
      ...greasemonkey.configs.recommended.rules,
    },
  }
]);
