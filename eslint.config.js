import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

const asWarnings = (rules) =>
  Object.fromEntries(
    Object.entries(rules).map(([ruleName, ruleConfig]) => {
      if (ruleConfig === "off" || ruleConfig === 0) {
        return [ruleName, ruleConfig];
      }

      if (Array.isArray(ruleConfig) && (ruleConfig[0] === "off" || ruleConfig[0] === 0)) {
        return [ruleName, ruleConfig];
      }

      return [ruleName, Array.isArray(ruleConfig) ? ["warn", ...ruleConfig.slice(1)] : "warn"];
    }),
  );

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "coverage"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      sourceType: "module",
    },
    plugins: {
      "jsx-a11y": jsxA11y,
      react,
      "react-hooks": reactHooks,
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      ...asWarnings(react.configs.flat.recommended.rules),
      ...asWarnings(react.configs.flat["jsx-runtime"].rules),
      ...asWarnings(reactHooks.configs.recommended.rules),
      ...asWarnings(jsxA11y.flatConfigs.recommended.rules),
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "simple-import-sort/exports": "warn",
      "simple-import-sort/imports": "warn",
      "unused-imports/no-unused-imports": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  prettier,
);
