$ErrorActionPreference = "Stop"

$serviceName = "RhinopassNfcBridge"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir "..")

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  throw "Node.js was not found in PATH. Please install Node.js 20.x."
}

$nssm = (Get-Command nssm -ErrorAction SilentlyContinue).Source
if (-not $nssm) {
  throw "NSSM was not found in PATH. Install NSSM and add it to PATH first."
}

$distEntry = Join-Path $root "dist\\index.js"
if (-not (Test-Path $distEntry)) {
  throw "Build output not found. Run: npm run build"
}

Write-Host "Installing service '$serviceName'..."
& $nssm install $serviceName $node $distEntry
& $nssm set $serviceName AppDirectory $root
& $nssm set $serviceName Start SERVICE_AUTO_START

Write-Host "Starting service '$serviceName'..."
& $nssm start $serviceName

Write-Host "Done."
