# Contributing to Bookshelf

This is a side project that grew into something useful — contributions are warmly welcomed.

## Ways to contribute

- **Bug reports** — Open an issue with steps to reproduce, expected vs. actual behaviour, and your OS/browser.
- **Feature ideas** — Open an issue before writing code. Discuss it first so we don't duplicate effort.
- **Pull requests** — Bug fixes and small improvements can go straight to a PR. For larger features, open an issue first.
- **Design feedback** — Screenshots, Figma comments, or text descriptions all work.
- **Docs** — Typos, missing steps in the README, or anything confusing is fair game.

## Local dev setup

See the [Getting started](README.md#getting-started) section in the README. The short version:

```bash
git clone https://github.com/mfrashad/bookshelf.git
cd bookshelf
npm install
cp .env.example .env.local   # fill in your keys
npx convex dev               # terminal 1
npm run dev                  # terminal 2
```

## Branch naming

```
feat/short-description
fix/short-description
docs/short-description
```

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add mosaic export format
fix: correct page count for imported Goodreads books
docs: add Hardcover setup instructions to README
```

## Pull request flow

1. Fork the repo and create a branch from `main`.
2. Make your changes. Run `npm run lint` before pushing.
3. If you added new behaviour, add or update a Playwright test under `tests/`.
4. Open a PR. Describe what changed and why. Link the related issue if there is one.
5. A maintainer will review and merge.

Please don't force-push to your branch after a review has started — it makes it harder to follow along.

## Code style

- ESLint is configured. `npm run lint` must pass before merging.
- TypeScript strict mode is on — don't use `any` unless you have a good reason.
- Inline styles are the project's current pattern (no CSS modules, no Tailwind utility classes on new components).

## Tests

```bash
npm run test:e2e         # run Playwright tests headlessly
npm run test:e2e:ui      # open Playwright UI
```

Run the suite before opening a PR. Failing tests block merge.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.
