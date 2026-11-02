# EcoGrid

**Clean power that proves itself.** EcoGrid pays producers for verified clean-energy data on
[Base](https://base.org). Every meter signs its own readings. A public contract checks each one and
pays `$GRID` straight to the producer's wallet. AI agents buy the verified data with `$GRID`, and
half of every payment flows back to producers.

This repository holds the two web front ends:

| Page          | Path    | What it is                                                                                                           |
| ------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| Landing page  | `/`     | Explains the protocol, with interactive demos of reading verification, agent payments and rewards.                   |
| Microgrid app | `/app/` | Live 3D dashboard of meters, readings, `$GRID` payouts and AI agents, plus wallet connection and meter registration. |

> **Project status:** the front ends are complete. The smart contracts (`GridToken`,
> `EnergyRewards`, `DataMarket`, `VestingWallet`) and the gateway service are **not in this
> repository yet**, so the dashboard runs on a built-in simulated network ("Demo data") until a
> gateway URL is configured. Nothing here has been audited.

## Quick start

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open <http://localhost:5173> for the landing page and <http://localhost:5173/app/> for the dashboard.

## Scripts

| Command           | What it does                                           |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Start the dev server with hot reload                   |
| `npm run build`   | Typecheck and build both pages into `dist/`            |
| `npm run preview` | Serve the production build locally                     |
| `npm test`        | Run the unit tests (Vitest)                            |
| `npm run lint`    | Lint with ESLint                                       |
| `npm run format`  | Format everything with Prettier                        |
| `npm run check`   | Typecheck, lint, format check and tests (what CI runs) |

## Configuration

Copy `.env.example` to `.env.local` and fill in what you need. All variables are optional.

| Variable                  | Purpose                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `VITE_GATEWAY_URL`        | URL of an EcoGrid gateway. Empty, or unreachable, means the dashboard uses demo data. |
| `VITE_CHAIN_ID`           | Chain the wallet is asked to use: `8453` (Base) or `84532` (Base Sepolia, default).   |
| `VITE_GRID_TOKEN_ADDRESS` | `GridToken` address, used to show the connected wallet's `$GRID` balance.             |

`VITE_` variables are built into public JavaScript. Never put private keys or admin tokens in them.

## Project structure

```
index.html              Landing page entry
app/index.html          Dashboard entry
public/                 Static files (favicon)
src/
  landing/              Landing page: sections, copy, hero animation
    protocol.ts         Protocol rules shown in the demos (checks, emissions, 50/30/20 split)
  app/                  Dashboard
    components/         Panels and dialogs
    hooks/              Live data, wallet (EIP-1193) and media-query hooks
    lib/
      client.ts         Gateway REST + server-sent-events client, with demo fallback
      demoNetwork.ts    In-browser simulated network used in demo mode
      liveState.ts      Applies streamed events to dashboard state
    scene/              three.js / react-three-fiber 3D microgrid
  shared/               Code used by both pages
```

## Gateway API expected by the dashboard

When `VITE_GATEWAY_URL` is set, the dashboard calls these endpoints under `/api/v1`:

| Method | Path                                  | Returns                                                                                |
| ------ | ------------------------------------- | -------------------------------------------------------------------------------------- |
| GET    | `/status`                             | Gateway and chain health                                                               |
| GET    | `/stats`                              | Energy, rewards, verification and impact totals                                        |
| GET    | `/timeseries?minutes=30&bucketSec=60` | Wh per source per bucket                                                               |
| GET    | `/meters`, `/activity?limit=40`       | Registry and recent activity                                                           |
| GET    | `/market`, `/agents`                  | Data plans, payment split and agent usage                                              |
| POST   | `/meters`                             | Register a meter (`Authorization: Bearer <admin token>`)                               |
| POST   | `/simulate`                           | Ask the gateway's simulator for a round of readings                                    |
| GET    | `/stream`                             | Server-sent events: `reading`, `rejection`, `agent.query`, `agent.subscribed`, `meter` |

Errors are JSON: `{ "error": { "code": "admin_auth", "message": "…" } }`. The exact shapes are
defined in [`src/app/lib/types.ts`](src/app/lib/types.ts).

## Deployment

Pushing to `main` deploys both pages to GitHub Pages through
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). One-time setup: in the repository's
**Settings → Pages**, set **Source** to **GitHub Actions**. To point the hosted dashboard at a
gateway, add `VITE_GATEWAY_URL` (and optionally the other variables) under **Settings → Secrets and
variables → Actions → Variables**.

The build uses relative paths, so `dist/` also works on Netlify, Vercel, Cloudflare Pages or any
static host.

## Roadmap

- [x] Landing page and 3D microgrid dashboard
- [x] Demo network, wallet connection, tests and CI
- [ ] Solidity contracts with tests (`GridToken`, `EnergyRewards`, `DataMarket`, `VestingWallet`)
- [ ] Gateway service implementing the API above
- [ ] Meter firmware SDK and agent SDK
- [ ] Independent audit, then mainnet

## Disclaimer

`$GRID` is a utility token that rewards verified energy reporting and pays for data access. It is
not an investment, an equity interest, a carbon credit or a claim on electricity. Nothing in this
repository is financial advice.

## License

[MIT](LICENSE)
