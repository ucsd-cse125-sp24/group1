// @ts-check

import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import * as pluginImport from "eslint-plugin-import";

export default tseslint.config(tseslint.configs.base, {
	languageOptions: {
		parserOptions: {
			project: true,
			tsconfigRootDir: import.meta.dirname,
		},
	},
	rules: {
		"import/order": "warn",
		"unused-imports/no-unused-imports": "warn",
		"unused-imports/no-unused-vars": "off",
	},
	plugins: {
		"unused-imports": unusedImports,
		import: pluginImport,
	},
	files: ["**/*.ts", "**/*.js"],
	ignores: ["dist/", "public/"],
});
