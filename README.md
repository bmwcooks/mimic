# Mimic

A personal catalog for TCGplayer data. Pick a game, pick a set, and keep only the columns you want.

The earlier Mimic projects collected every active card game. This version reads TCGplayer’s public catalog (games, sets, products, and prices) through [TCGCSV](https://tcgcsv.com/) and lets you save a shelf of just the rows and fields you choose. Prices can lag the live marketplace by about a day. The shelf lives in this browser.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:38471](http://127.0.0.1:38471).

## What you can do

- Browse TCGplayer categories, newest sets first.
- Hide promo and supplemental groups, or search them.
- Turn columns on and off: name, set, number, rarity, printing, prices, image, product id, and the TCGplayer link.
- Keep selected rows, or every row in the current filter.
- Export the shelf as CSV using only the columns that are turned on.

Card rules text is not stored. The shelf keeps identity and price fields, not the full card write-up.
