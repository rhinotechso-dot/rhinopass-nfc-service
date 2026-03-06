# rhinopass-nfc-service

Local NFC bridge service for RhinoPass.

## What it does
- Listens to NFC reader events (PC/SC)
- Writes a token to the tag (NDEF text record)
- Sends the UID + token over WebSocket to the dashboard

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

## Service install
- Windows (WinSW): `docs/windows-service.md`
- macOS: `docs/macos-service.md`

## WebSocket events
Client -> Bridge:
```json
{ "type": "link:start", "token": "YOUR_DEVICE_TOKEN" }
{ "type": "link:stop" }
{ "type": "ping" }
```

Bridge -> Client:
```json
{ "type": "bridge:ready", "payload": { "version": "0.1.0", "readers": [] } }
{ "type": "badge:detected", "payload": { "uid": "04A1B2...", "reader": "OMNIKEY 5021", "timestamp": "..." } }
{ "type": "badge:written", "payload": { "uid": "04A1B2...", "token": "rp_badge_...", "reader": "OMNIKEY 5021", "timestamp": "..." } }
{ "type": "badge:error", "payload": { "reader": "OMNIKEY 5021", "message": "..." } }
```
