import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
    ignores: ["dist/**/*", "node_modules/**/*"],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  prettierConfig,
];
