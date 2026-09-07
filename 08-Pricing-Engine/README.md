# HyperSync Enterprise Pricing Engine

**Interactive Enterprise Cost & Pricing Model**

An interactive pricing and scenario-modeling application. Authorized users enter their
organization's actual operating assumptions and the application calculates an estimated
HyperSync enterprise implementation and recurring pricing model. Every calculated value
updates as inputs change.

This is not a static pricing page and it is not a quotation.

---

## Running it

Open `index.html` in a browser. There is no build step, no package manager, and no network
dependency — the application runs from the local filesystem (`file://`) or from any static
host.

```
08-Pricing-Engine/
├── index.html            application shell
├── assets/styles.css     presentation layer
└── src/
    ├── format.js         numeric sanitation + currency / percentage formatting
    ├── model.js          INPUT DATA + PRICING ASSUMPTIONS  (the registry)
    ├── engine.js         CALCULATION ENGINE                (pure functions)
    ├── charts.js         VISUALIZATION                     (dependency-free SVG)
    └── app.js            UI orchestration                  (no pricing logic)
```

---

## Calculation architecture

The layers are separated so pricing rules can evolve without rebuilding the interface.

```
model.js      inputs + assumptions, each with a declared source type
    ↓
engine.js     cost basis  →  commercial model  →  customer price  →  5-year projection
    ↓
app.js        renders results; contains no formulas
    ↓
charts.js     draws labelled numbers; knows nothing about pricing
```

`engine.js` is a pure function of the values object: no DOM access, no formatting, no
global state. It can be executed under Node for regression testing.

### Changing a rate

Edit the `def` value of the relevant entry in `src/model.js`. The input control, the
assumption-transparency row, the source-type label, and every downstream calculation
follow automatically. No UI work is required.

### Adding a new assumption

Add one `f({ ... })` record to the registry in `src/model.js` and read it in `engine.js`.
The UI generates itself from the registry, so a rate cannot participate in a calculation
without also appearing — with its source type — in the Pricing Assumptions panel.

---

## The three concepts the model keeps separate

| Concept | What it is | What moves it |
|---|---|---|
| **Cost to operate HyperSync** | Third-party infrastructure, implementation delivery, and recurring service cost basis | Enterprise scale and vendor / delivery rates |
| **Price charged for HyperSync** | Cost basis transformed by the commercial model | Margin or markup assumptions |
| **Customer-specific enterprise scale** | Users, facilities, business units, operating systems, workflows, transaction volume | Customer input |

A change in enterprise scale moves cost, and price follows from it. A change in commercial
margin moves price only and never alters the underlying operating cost.

---

## Commercial model

Markup and gross margin are distinct methodologies and are stored as two independent rate
sets. Switching methodology never reinterprets a rate entered under the other one.

```
Markup pricing:        Price = Cost × (1 + Markup Rate)
Gross-margin pricing:  Price = Cost ÷ (1 − Target Gross Margin)
```

The active methodology is named on screen wherever price is shown. Margin assumptions are
held separately for Implementation Services, Recurring HyperSync Services, Third-Party
Infrastructure, Premium Services, and Custom Integrations.

---

## Assumption transparency

Every rate the engine reads carries a source type:

| Source Type | Meaning |
|---|---|
| Customer Input | Supplied by the organization being modeled |
| Vendor Published Price | Taken from a vendor's published price list |
| Negotiated Vendor Price | Confirmed under a negotiated agreement |
| HyperSync Commercial Assumption | A HyperSync delivery or commercial rate |
| Estimated | An informed estimate, not established |
| TBD | Not yet established; the value shown is an illustrative default |

Assumptions marked *Estimated* or *TBD* are flagged in the Pricing Assumptions panel and
counted in the register summary. No estimated value is presented as a verified vendor
price. Where a vendor rate is not public — enterprise automation platform pricing, for
example — the assumption is marked **TBD** and carries a clearly labeled example default
that must be replaced with the negotiated figure before any commercial commitment.

---

## Application modes

**Executive Estimate** exposes only the highest-impact variables needed to produce a useful
enterprise estimate. **Advanced Configuration** exposes the full infrastructure, usage,
implementation, support, integration, and pricing assumption set. Switching between modes
never discards entered values — both modes read and write the same values object.

**Presentation Mode** hides configuration controls and leaves the organization profile,
executive metrics, cost breakdown, price breakdown, multi-year projection, scenario
comparison, and pricing-assumptions summary, for screen sharing during an executive or
shareholder presentation.

---

## Scenario modeling

Three scenario slots — Conservative, Expected, High-Scale — each store a complete snapshot
of the current assumptions. Saved scenarios are compared side by side on users, task
volume, API volume, infrastructure cost, implementation cost, recurring cost, Year-1 price,
annual recurring price, 3-year value, 5-year value, and gross margin. Scenarios and the
working model persist in browser local storage.

---

## Sample model

**Load Sample Enterprise** populates a fictional organization used to demonstrate the
model. It is labeled *ILLUSTRATIVE SAMPLE — NOT A CUSTOMER QUOTE* throughout, overrides
customer-supplied scale only, and leaves every rate at its default so the sample never
implies a negotiated vendor or commercial price. It does not represent any actual
organization's operating metrics.

**Reset Model** restores every input and assumption to its default. Saved scenarios are
kept.

---

## Numeric safety

All input is sanitized before it reaches the engine. Negative user counts, negative task
counts, blank fields, and out-of-range percentages are clamped; target gross margin is
bounded below 100% so `Cost ÷ (1 − GM)` can never divide by zero or invert. Division by a
zero denominator returns a defined fallback. `NaN`, `Infinity`, and negative-zero cannot
reach the screen.

---

## Scope of output

The application produces modeled estimates from the assumptions entered into it. Output is
not a quotation, offer, or contractual commitment, and no figure should be treated as a
verified vendor price unless its source type states otherwise.
