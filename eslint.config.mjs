import tsParser from "@typescript-eslint/parser";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";

export default [
  {
    ignores: ["dist/**", "coverage/**", "reports/**", "node_modules/**"]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module"
    },
    plugins: {
      sonarjs,
      unicorn
    },
    rules: {
      ...sonarjs.configs.recommended.rules,
      ...unicorn.configs.unopinionated.rules,
      "unicorn/numeric-separators-style": [
        "error",
        {
          onlyIfContainsSeparator: true
        }
      ]
    }
  },
  prettierRecommended
];
