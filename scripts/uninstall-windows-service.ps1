$ErrorActionPreference = "Stop"

$serviceName = "RhinopassNfcBridge"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir "..")
$winswExe = Join-Path $root "tools\\RhinopassNfcBridgeService.exe"
if (-not (Test-Path $winswExe)) {
  throw "WinSW executable not found. Place it at: $winswExe"
}

Write-Host "Stopping service '$serviceName'..."
& $winswExe stop | Out-Null

Write-Host "Removing service '$serviceName'..."
& $winswExe uninstall

Write-Host "Done."
