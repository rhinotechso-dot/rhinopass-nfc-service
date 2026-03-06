# Rhinopass NFC Bridge - Windows Service Install

This guide installs the NFC bridge as a Windows Service so it runs in the
background and starts on boot.

## Before you start
- Use **PowerShell (normal)** for install/build steps.
- Use **PowerShell as Administrator** only when installing/uninstalling the
  Windows service.

## 1) Install prerequisites
Install these first:
- Node.js 20.x LTS (Windows installer)
  https://nodejs.org/en/download
- Python 3.11.x
  https://www.python.org/downloads/release/python-3119/
- Visual Studio Build Tools 2022
  https://visualstudio.microsoft.com/visual-cpp-build-tools/
  During install, select **Desktop development with C++** and a **Windows 10/11 SDK**.

## 2) Clone the repo
Open PowerShell (normal) and run:
```powershell
git clone https://github.com/rhinotechso-dot/rhinopass-nfc-service.git
cd rhinopass-nfc-service
```
You can clone to any folder you want. Once installed as a service, do not move
the folder unless you uninstall and reinstall the service.

## 3) Download WinSW
1. Open the WinSW releases page:
   https://github.com/winsw/winsw/releases
2. Download **WinSW-x64.exe**.
3. Rename it to: `RhinopassNfcBridgeService.exe`.
4. Place it in the repo under `tools`:
```powershell
New-Item -ItemType Directory -Force tools
Move-Item "$env:USERPROFILE\Downloads\WinSW-x64.exe" "tools\RhinopassNfcBridgeService.exe"
```
(Adjust the path if you downloaded to a different folder.)

## 4) Install dependencies + build
```powershell
npm install
npm run build
```

## 5) Configure environment (required)
```powershell
Copy-Item .env.example .env
notepad .env
```
Set the value:
```
NFC_BRIDGE_TOKEN=your_device_token_here
```
Important:
- `NFC_BRIDGE_TOKEN` should match your dashboard's
  `NEXT_PUBLIC_NFC_BRIDGE_TOKEN` so only authorized devices can link badges.

## 6) Install the Windows service (Admin PowerShell)
1. Open **PowerShell as Administrator**.
2. Run:
```powershell
cd "path\to\rhinopass-nfc-service"
powershell -ExecutionPolicy Bypass -File scripts\install-windows-service.ps1
```

## 7) Uninstall the service (Admin PowerShell)
```powershell
cd path\to\rhinopass-nfc-service
powershell -ExecutionPolicy Bypass -File scripts\uninstall-windows-service.ps1
```

## Notes
- The service runs `node dist/index.js`.
- Logs are stored in `logs/`.
- If you move the folder, re-install the service so the path stays correct.

## Check service status (any PowerShell)
```powershell
Get-Service -Name RhinopassNfcBridge
```

## Start / stop service (Admin PowerShell)
```powershell
Start-Service -Name RhinopassNfcBridge
Stop-Service -Name RhinopassNfcBridge
```
These commands can be run from any folder.
