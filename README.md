# rhinopass-nfc-service

Local NFC bridge service for RhinoPass.

## What it does
- Listens to NFC reader events (PC/SC)
- Writes a token to the tag (NDEF text record)
- Sends the UID + token over WebSocket to the dashboard

## Desktop app (recommended)
This bridge ships as a small desktop app for non-technical admins.
The app lets them:
- See reader status
- Save the device token
- Choose auto-start on login

Use the desktop app for production devices.

## Environment
Copy `.env.example` to `.env` and adjust if needed.
Set `NFC_BRIDGE_TOKEN` to a device token used by the dashboard when linking
badges. If using the desktop app, the token can be saved from the UI.

## Run (dev: bridge only)
```bash
npm install
npm run dev:bridge
```

## Run (dev: desktop app)
```bash
npm run build
npm run dev:app
```

## Run (prod: desktop app)
```bash
npm run build
npm start
```

## Package installers
```bash
npm run dist
```
The installers are generated in the `release/` folder.

## GitHub Releases (recommended for distribution)
Create a version tag and push it to build Windows + macOS installers and publish
them as a GitHub Release.

```bash
git tag v0.1.0
git push origin v0.1.0
```

The release assets will include the installers plus `INSTALLATION.txt`.

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
