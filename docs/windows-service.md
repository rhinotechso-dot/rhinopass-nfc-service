# Rhinopass NFC Bridge - Windows Service Install

This guide installs the NFC bridge as a Windows Service so it runs in the
background and starts on boot.

## Prerequisites (required versions)
- Node.js 20.x LTS (Windows installer) - (alternatively use nvm-windows)  
  https://nodejs.org/en/download
- Python 3.11.x  
  https://www.python.org/downloads/release/python-3119/
- Visual Studio Build Tools 2022  
  https://visualstudio.microsoft.com/visual-cpp-build-tools/  
  During install, select **Desktop development with C++** and a **Windows 10/11 SDK**.
- WinSW (Windows Service Wrapper)  
  https://github.com/winsw/winsw/releases

## WinSW download checklist
1. Download `WinSW-x64.exe` from the releases page.
2. Rename it to: `RhinopassNfcBridgeService.exe`.
3. Place it here: `tools\RhinopassNfcBridgeService.exe`.

## Build the service
From the repo root:
```powershell
npm install
npm run build
```

## Configure environment
Copy `.env.example` to `.env` and update values as needed.

Important:
- `NFC_BRIDGE_TOKEN` should match your dashboard's
  `NEXT_PUBLIC_NFC_BRIDGE_TOKEN` so only authorized devices can link badges.

## Install with WinSW (recommended)
1. Download WinSW from the releases page and rename it to
   `RhinopassNfcBridgeService.exe`.
2. Place it here:
   `tools\RhinopassNfcBridgeService.exe`
3. Run the installer script as Administrator:
```powershell
scripts\install-windows-service.ps1
```

## Uninstall
```powershell
scripts\uninstall-windows-service.ps1
```

## Notes
- The service runs `node dist/index.js`.
- If you move the folder, re-install the service so the path stays correct.
