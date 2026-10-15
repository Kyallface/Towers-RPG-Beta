# Card Catalogue

The catalogue is a platform-neutral JSON list of reusable card components: **Forms** and **Modifiers**. Any client (React today, other platforms later) can read it. It never contains Quest Portal expressions.

| File | Purpose |
| --- | --- |
| `catalogue.json` | The catalogue the app loads (currently a small provisional test catalogue). |
| `catalogue.schema.json` | Machine-readable JSON Schema (draft 2020-12): field types, required fields, numeric bounds and effect syntax. |
| `../lib/catalogue/fixtures/` | One valid and several invalid examples, used by the tests. |

## Entry fields

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | Required, unique within the catalogue, stable. Lowercase slug: `physical`, `long-range`. |
| `name` | string | Required, 1-80 characters. |
| `type` | `"Form"` or `"Modifier"` | Required, case-sensitive. |
| `effect` | string | Required. One or more effects separated by commas, e.g. `"1d6 physical"` or `"2d8 fire, 30 ft range"` (see below). |
| `description` | string | Required, 1-1000 characters. |
| `level` | integer | Required, 0-20. |
| `cost` | integer | Required, 0-100. Cost of **one** occurrence on a card. |
| `alignment` | string | Required. Forms use `Phy`, `Int` or `Emo`; Modifiers use `Pow` or `Fin` (e.g. Physical is `"Phy"`, Range is `"Pow"`). A resolved card shows its unique alignments, Form first then Mod, e.g. `Phy-Pow`. |
| `requirement` | string | Required. Requirement (shown as **REQ**): a stat followed by a value 1-10. Forms use `Phy`, `Int` or `Emo` (e.g. `"Phy1"`, `"Emo8"`); Modifiers use `Pow` or `Fin` (e.g. `"Pow3"`, `"Fin1"`). On a resolved card, REQ is the highest value for each stat across its components. |

Every alignment pairs a Form stat with a Mod stat: Phy-Pow, Phy-Fin, Int-Pow, Int-Fin, Emo-Pow, Emo-Fin. Legacy single letters are still accepted and mapped by type: on a Form `P`/`I`/`E` become `Phy`/`Int`/`Emo`; on a Modifier `P`/`F` become `Pow`/`Fin`.
| `provisional` | boolean | Optional, default `false`. `true` means level and cost are placeholders, not final balance. |

The envelope is `{ "schemaVersion": 2, "entries": [...] }`. Readers must reject any `schemaVersion` they do not support. Unknown properties are rejected, so typos get caught.

## Effect syntax

Case and extra spaces are ignored.

| Form | Rules | Meaning |
| --- | --- | --- |
| `<count>d<sides> <damage type>` | count 1-20; sides 4, 6, 8, 10, 12 or 20; damage type a lowercase word | Adds `count`d`sides` of that damage type per occurrence. |
| `<value> ft range` | value 1-1000; unit `ft` only | Adds `value` feet of range per occurrence. |

## Stacking contract (prototype)

Cards store a list of catalogue IDs. Duplicates are allowed and each occurrence counts. Resolution is deterministic:

1. **Dice** with the same `damageType` and `sides` combine by adding `count`.
2. **Range** values add together, in feet.
3. Different effect kinds are never merged.
4. Unsupported combinations are reported as errors and never silently dropped. For example, `1d6 physical` + `1d8 physical` (same damage type, different die sizes) is unsupported.
5. Total cost is the sum of `cost` across every occurrence.

Behaviour comes only from the parsed `effect` data, never from the `id` or `name`.

### Acceptance example

Using `catalogue.json`:

```
[physical, physical, range, range]
  → 2d6 physical, 20 ft range, 4 points (provisional)
```
