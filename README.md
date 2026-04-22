# Conferencio

## Setup

```bash
npm install
copy server\.env.example server\.env
copy client\.env.example client\.env
```

Start MongoDB, then run:

```bash
npm run dev
```

## Endpoints

- Client: http://localhost:5173
- API health: http://localhost:4000/api/health

## Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run start`

## Vercel

This repo is configured for Vercel with [vercel.json](vercel.json).

Set these environment variables in Vercel:

- `MONGODB_URI`
- `CLIENT_ORIGIN` (your deployed frontend URL)
- `VITE_SERVER_URL` (URL of your signaling backend)

Notes:

- The frontend is served from `client/dist`.
- API routes are available at `/api/health` and `/api/rooms/:roomId` via Vercel Functions.
- Socket signaling should use `VITE_SERVER_URL` pointing to a long-running backend service.
