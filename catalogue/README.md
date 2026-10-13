# Card Catalogue

The catalogue is a platform-neutral JSON list of reusable card components: **Forms** and **Modifiers**. Any client (React today, other platforms later) can read it. It never contains Quest Portal expressions.

| File | Purpose |
| --- | --- |
| `catalogue.json` | The catalogue the app loads (currently a small provisional test catalogue). |
| `catalogue.schema.json` | Machine-readable JSON Schema (draft 2020-12): field types, required fields, numeric bounds, effect kinds and units. |
| `examples/` | One valid and several invalid examples, used by the tests. |

## Entry fields

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | Required, unique within the catalogue, stable. Lowercase slug: `physical`, `long-range`. |
| `name` | string | Required, 1-80 characters. |
| `type` | `"Form"` or `"Modifier"` | Required, case-sensitive. |
| `level` | integer | Required, 0-20. |
| `pointCost` | integer | Required, 0-100. Cost of **one** occurrence on a card. |
| `provisional` | boolean | Optional, default `false`. `true` means level and point cost are placeholders, not final balance. |
| `effects` | array | Required, at least one effect (see below). |
| `description` | string | Required, 1-1000 characters. |

The envelope is `{ "schemaVersion": 1, "entries": [...] }`. Readers must reject any `schemaVersion` they do not support. Unknown properties are rejected, so typos get caught.

## Effect kinds

| `kind` | Fields | Meaning |
| --- | --- | --- |
| `dice` | `count` (1-20), `sides` (4, 6, 8, 10, 12, 20), `damageType` (slug) | Adds `count`d`sides` of `damageType` per occurrence. |
| `range` | `value` (1-1000), `unit` (`"ft"`) | Adds `value` feet of range per occurrence. |

## Stacking contract (prototype)

Cards store a list of catalogue IDs. Duplicates are allowed and each occurrence counts. Resolution is deterministic:

1. **Dice** with the same `damageType` and `sides` combine by adding `count`.
2. **Range** values add together, in feet.
3. Different effect kinds are never merged.
4. Unsupported combinations are reported as errors and never silently dropped. For example, `1d6 physical` + `1d8 physical` (same damage type, different die sizes) is unsupported.
5. Total point cost is the sum of `pointCost` across every occurrence.

Behaviour comes only from the structured effect data, never from the `id` or `name`.

### Acceptance example

Using `catalogue.json`:

```
[physical, physical, range, range]
  → 2d6 physical, 20 ft range, 4 points (provisional)
```
