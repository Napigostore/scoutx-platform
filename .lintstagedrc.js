module.exports = {
  "apps/web/src/**/*.{ts,tsx,js,jsx,mjs}": (filenames) => [
    `pnpm --filter @scoutx/web exec eslint --fix ${filenames.join(" ")}`,
    `prettier --write ${filenames.join(" ")}`,
  ],
  "packages/!(performance)/src/**/*.{ts,tsx,js,jsx,mjs}": [
    "eslint --fix",
    "prettier --write",
  ],
  "!(packages/performance)/**/*.{json,md,css,yml,yaml}": [
    "prettier --write",
  ],
};
