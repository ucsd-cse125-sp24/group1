import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

// might need to add https://github.com/prettier/eslint-config-prettier
// if there are conflicts
export default [
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
