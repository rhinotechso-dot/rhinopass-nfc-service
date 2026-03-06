$ErrorActionPreference = "Stop"

$serviceName = "RhinopassNfcBridge"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir "..")

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  throw "Node.js was not found in PATH. Please install Node.js 20.x."
}

$winswExe = Join-Path $root "tools\\RhinopassNfcBridgeService.exe"
if (-not (Test-Path $winswExe)) {
  throw "WinSW executable not found. Place it at: $winswExe"
}

$distEntry = Join-Path $root "dist\\index.js"
if (-not (Test-Path $distEntry)) {
  throw "Build output not found. Run: npm run build"
}

$logDir = Join-Path $root "logs"
if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
}

$winswConfig = [System.IO.Path]::ChangeExtension($winswExe, ".xml")
$xml = @"
<service>
  <id>$serviceName</id>
  <name>Rhinopass NFC Bridge</name>
  <description>Rhinopass NFC bridge service</description>
  <executable>$node</executable>
  <arguments>$distEntry</arguments>
  <workingdirectory>$root</workingdirectory>
  <startmode>Automatic</startmode>
  <logpath>$logDir</logpath>
  <log mode="roll-by-size">
    <sizeThreshold>10240</sizeThreshold>
    <keepFiles>5</keepFiles>
  </log>
</service>
"@
$xml | Set-Content -Path $winswConfig -Encoding UTF8

Write-Host "Installing service '$serviceName'..."
& $winswExe install

Write-Host "Starting service '$serviceName'..."
& $winswExe start

Write-Host "Done."
