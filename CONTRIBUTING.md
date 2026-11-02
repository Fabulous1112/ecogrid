# Contributing

Thanks for helping build EcoGrid.

1. Use Node 20 or newer (`.nvmrc` pins 22) and run `npm install`.
2. Create a branch, make your change, and add or update tests in `src/**/*.test.ts`.
3. Run `npm run check` (typecheck, lint, format check and tests). CI runs the same steps plus a build.
4. Open a pull request describing what changed and why.

Code style is enforced by Prettier and ESLint; `npm run format` fixes formatting.
Keep protocol numbers (emission rate, the 50/30/20 split, capacity rules) in sync with the
contracts, and cover any change to them with a test.
