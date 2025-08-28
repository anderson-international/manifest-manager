# Manifest Manager — Mintsoft Micro Client

This repository contains a small, reusable Mintsoft transport client and a health endpoint to verify credentials.

## Mintsoft micro client

Location: `src/lib/mintsoft/client.ts`

Exports:
- `createMintsoftHttp()` — returns a preconfigured Axios instance using:
  - `baseURL = process.env.MINTSOFT_API_URL`
  - headers: `Accept: application/json`, `ms-apikey: process.env.MINTSOFT_API_KEY`
  - `timeout = 30000`
- `healthCheck()` — calls `GET /api/Order/Statuses` and returns:
  - on success: `{ ok: true, status, count }`
  - on failure: `{ ok: false, status, error }`

Related route: `src/server/routes/mintsoft-health.ts`
- `GET /mintsoft/health` returns the `healthCheck()` result. Useful to confirm env + header configuration quickly.

## Environment

`.env` must define:
```
MINTSOFT_API_URL=https://api.mintsoft.co.uk
MINTSOFT_API_KEY=<your-api-key>
```
`dotenv` is loaded in `src/config/env.ts` and validated with `zod`.

## Usage inside this app

- The existing integration `src/integrations/mintsoft/client.ts` now uses `createMintsoftHttp()` internally; its public API did not change.
- Example domain calls (orders/statuses/couriers) continue to work via `MintsoftClient`.

## Quick test (health)

- Start the server (dev): `npm run server:dev`
- Hit: `http://localhost:4000/mintsoft/health`
- Expect: `{ ok: true, status: 200, count: <number> }`

## Reusing the micro client in another app

1) Add env and dependencies
- `.env`:
```
MINTSOFT_API_URL=https://api.mintsoft.co.uk
MINTSOFT_API_KEY=<your-api-key>
```
- Install deps: `axios`, `dotenv` (if you want auto env loading)

2) Copy the micro client or import it if sharing source
```ts
// mintsoft-client.ts
import axios, { AxiosInstance } from 'axios';

export function createMintsoftHttp(): AxiosInstance {
  return axios.create({
    baseURL: process.env.MINTSOFT_API_URL,
    headers: {
      'Accept': 'application/json',
      'ms-apikey': process.env.MINTSOFT_API_KEY as string,
    },
    timeout: 30000,
  });
}

export async function healthCheck() {
  const http = createMintsoftHttp();
  try {
    const res = await http.get('/api/Order/Statuses');
    const data = Array.isArray(res.data) ? res.data : [];
    return { ok: true as const, status: res.status, count: data.length };
  } catch (err: any) {
    const status = err?.response?.status ?? 0;
    const message = err?.message || 'Unknown error';
    return { ok: false as const, status, error: message };
  }
}
```

3) Make a request using the shared transport
```ts
import { createMintsoftHttp } from './mintsoft-client';

const http = createMintsoftHttp();
const orders = await http.get('/api/Order/List');
console.log(orders.status, Array.isArray(orders.data), orders.data.length);
```

4) Troubleshooting `400` auth errors
- Ensure header name is exactly `ms-apikey`.
- Confirm `MINTSOFT_API_URL=https://api.mintsoft.co.uk`.
- Verify env is loaded at runtime and contains no trailing spaces.
- Test with the `healthCheck()` first to isolate problems.

## Promotion path

If multiple apps need richer helpers and types, promote the micro client to a proper SDK package and keep this transport as the core. That migration will be low-churn because consumers already rely on the same header/baseURL pattern.
