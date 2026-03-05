$ErrorActionPreference = "Stop"

$serviceName = "RhinopassNfcBridge"
$nssm = (Get-Command nssm -ErrorAction SilentlyContinue).Source

if (-not $nssm) {
  throw "NSSM was not found in PATH."
}

Write-Host "Stopping service '$serviceName'..."
& $nssm stop $serviceName | Out-Null

Write-Host "Removing service '$serviceName'..."
& $nssm remove $serviceName confirm

Write-Host "Done."
