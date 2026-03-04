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

## Install & Use
See `docs/INSTALLATION.txt` included with the installer package.

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
