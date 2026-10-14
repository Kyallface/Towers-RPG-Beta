# Towers-RPG-Beta

Web companion for the Towers TTRPG, built with Next.js.

## Commands

```bash
pnpm install
pnpm dev     # run the app at http://localhost:3000
pnpm test    # run the catalogue tests
pnpm build   # production build
```

## Card Catalogue

Forms and Modifiers live in [`content/catalogue.json`](content/catalogue.json). See [`catalogue/README.md`](catalogue/README.md) for the schema, effect kinds and stacking rules. The app validates the catalogue before showing it on the Cards page, so edits to the JSON show up without any code changes.
