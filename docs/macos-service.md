# Rhinopass NFC Bridge - macOS Service Install

This guide installs the NFC bridge as a macOS background service using
`launchd`. It will run on login and restart automatically.

## Prerequisites
- Node.js 20.x LTS  
  https://nodejs.org/en/download
- Xcode Command Line Tools  
  Run: `xcode-select --install`
- Python 3 (for native module builds)  
  Usually included on macOS; verify with `python3 --version`.

## Build the service
From the repo root:
```bash
npm install
npm run build
```
You can clone to any folder you want. Once installed as a service, do not move
the folder unless you uninstall and reinstall the service.

## Configure environment (required)
From the repo root:
```bash
cp .env.example .env
open -a TextEdit .env
```
Set the value:
```
NFC_BRIDGE_TOKEN=your_device_token_here
```

Important:
- `NFC_BRIDGE_TOKEN` should match your dashboard's
  `NEXT_PUBLIC_NFC_BRIDGE_TOKEN` so only authorized devices can link badges.

## Install (launchd)
Run:
```bash
chmod +x scripts/install-macos-service.sh scripts/uninstall-macos-service.sh scripts/run-bridge.sh
./scripts/install-macos-service.sh
```
If macOS blocks the scripts (Gatekeeper), run:
```bash
xattr -dr com.apple.quarantine .
```

## Uninstall
```bash
./scripts/uninstall-macos-service.sh
```

## Notes
- Logs are written to `logs/bridge.out.log` and `logs/bridge.err.log`.
- If you move the folder, re-install the service so the path stays correct.

## Check service status
```bash
launchctl list | grep com.rhinopass.nfcbridge
```

## Start / stop service
```bash
launchctl kickstart -k gui/$(id -u)/com.rhinopass.nfcbridge
launchctl bootout gui/$(id -u)/com.rhinopass.nfcbridge
```
These commands can be run from any folder.
