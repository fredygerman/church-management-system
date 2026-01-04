const { resolve } = require("node:path");

// Try to find tsconfig.json in the current directory first, then fallback to common locations
function findTsConfig() {
  const cwd = process.cwd();
  const tsConfigPaths = [
    resolve(cwd, "tsconfig.json"),
    resolve(cwd, "tsconfig.eslint.json"),
    resolve(cwd, "../../tsconfig.json"),
  ];

  for (const path of tsConfigPaths) {
    try {
      require("fs").accessSync(path);
      return path;
    } catch {
      // Continue to next path
    }
  }

  // Return undefined if no tsconfig found - ESLint will work without it
  return undefined;
}

const project = findTsConfig();

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    require.resolve("@vercel/style-guide/eslint/next"),
    "turbo",
  ],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
    browser: true,
  },
  plugins: ["only-warn"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    // Ignore dotfiles
    ".*.js",
    "node_modules/",
    ".next/",
    "out/",
    "dist/",
  ],
  overrides: [
    {
      files: ["*.js?(x)", "*.ts?(x)"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project,
      },
    },
  ],
};
