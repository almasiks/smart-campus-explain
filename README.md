# Smart Campus Room Availability Checker

A client-side React app that checks whether **Room 301** is free for a requested time. It uses fictional bookings and a fixed "now" of 09:00. It only gives an availability decision: nothing is booked or saved, and there is no backend, database or login.

## Setup

Requires Node.js and npm (baseline: Node v24.13.1, npm 11.8.0).

```sh
npm ci              # install exact locked dependencies
npm run dev         # local dev preview
npm test            # unit tests (Vitest)
npm run typecheck   # TypeScript check
npm run lint        # ESLint
npm run build       # production build into dist/
```

## Planned feature: Explain availability

A button gives a short plain-text explanation of the checker's decision. It appears in a separate panel whose label says whether the text is AI-generated, a demo, or a standard fallback, and always that it is not a booking confirmation. The checker stays the only authority, and failures fall back to fixed text.
**Status: not implemented yet** (contract only).

## More

- [AGENTS.md](AGENTS.md): project rules, acceptance criteria (AC1–AC6, XAC1–XAC5) and constraints.
- [docs/](docs/): baseline (`01-baseline.md`) and feature contract (`02-feature-contract.md`).
