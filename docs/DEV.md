# Developer Notes (Internal)

This file contains development instructions for the NFC bridge service.
It is intended for internal use only.

## Environment
Copy `.env.example` to `.env` and adjust if needed.
Set `NFC_BRIDGE_TOKEN` to a device token used by the dashboard when linking
badges.

## Run (dev)
```bash
npm install
npm run dev
```

## Run (prod)
```bash
npm run build
npm start
```