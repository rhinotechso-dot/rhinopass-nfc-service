# Developer Notes (Internal)

This file contains development and build instructions for the NFC bridge.
It is intended for internal use only.

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
