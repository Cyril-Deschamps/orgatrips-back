// eslint-disable-next-line import/no-commonjs
module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    sourceType: "module",
    babelOptions: { configFile: "./.babelrc.json" },
  },
  extends: ["recommended/esnext", "recommended/node", "prettier"],
  plugins: ["sort-destructure-keys"],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "warn",
    "block-scoped-var": "warn",
    "eol-last": ["warn", "always"],
    "import/prefer-default-export": 0,
    "class-methods-use-this": 0,
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "sort-destructure-keys/sort-destructure-keys": "warn",
  },
};
