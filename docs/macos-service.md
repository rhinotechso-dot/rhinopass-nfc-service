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

## Configure environment
Copy `.env.example` to `.env` and update values as needed.

Important:
- `NFC_BRIDGE_TOKEN` should match your dashboard's
  `NEXT_PUBLIC_NFC_BRIDGE_TOKEN` so only authorized devices can link badges.

## Install (launchd)
Run:
```bash
chmod +x scripts/install-macos-service.sh scripts/uninstall-macos-service.sh scripts/run-bridge.sh
./scripts/install-macos-service.sh
```

## Uninstall
```bash
./scripts/uninstall-macos-service.sh
```

## Notes
- Logs are written to `logs/bridge.out.log` and `logs/bridge.err.log`.
- If you move the folder, re-install the service so the path stays correct.
