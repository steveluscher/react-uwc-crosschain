/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/react-internal.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./packages/react-uwc-crosschain/tsconfig.lint.json",
  },
  rules: {
    "no-unused-vars": "off",
    "no-extra-boolean-cast": "off",
    "@typescript-eslint/no-unused-vars": ["error"],
  },
};
