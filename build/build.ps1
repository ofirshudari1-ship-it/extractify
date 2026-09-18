<#
.SYNOPSIS
  One-command build for Extractify: validate everything, then rebuild the
  installer ZIP at the project root as Extractify-v<version>.zip.

.DESCRIPTION
  Per STANDARDS.md section 9 ("build.ps1/build.bat שמייצר הכל בפקודה
  אחת"). Run from anywhere - it resolves the project root relative to its
  own location, not the caller's working directory.

  Steps:
    1. Parse manifest.json - single source of truth for the version number.
    2. Validate manifest.json and both _locales/*/messages.json as JSON.
    3. Syntax-check every hand-written JS file (node --check).
    4. Verify English/Hebrew translation key parity in extractify-i18n.js.
    5. Remove any stale Extractify-v*.zip in the project root.
    6. Rebuild the ZIP from exactly what Chrome needs to load the extension
       (manifest.json, src/, assets/, _locales/) - nothing else.
    7. Print a summary and exit non-zero on any failure, so this is safe
       to wire into a CI step later if that's ever needed.

.EXAMPLE
  powershell -File build\build.ps1
#>

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root

try {
    Write-Host "== Extractify build ==" -ForegroundColor Cyan

    # 1-2. Manifest + locales JSON validity, and the version they agree on.
    $manifest = Get-Content "manifest.json" -Raw | ConvertFrom-Json
    $version = $manifest.version
    Write-Host "Version (from manifest.json): $version"

    Get-Content "_locales/en/messages.json" -Raw | ConvertFrom-Json | Out-Null
    Get-Content "_locales/he/messages.json" -Raw | ConvertFrom-Json | Out-Null
    Write-Host "manifest.json + _locales/*/messages.json: valid JSON" -ForegroundColor Green

    # 3. Syntax-check every hand-written JS file.
    $jsFiles = @(
        "src/background/background.js",
        "src/content/content.js",
        "src/offscreen/offscreen.js",
        "src/options/options.js",
        "src/welcome/welcome.js",
        "src/shared/extractify-i18n.js",
        "src/shared/snaptable-ocr.js"
    )
    foreach ($f in $jsFiles) {
        node --check $f
        if ($LASTEXITCODE -ne 0) { throw "Syntax check failed: $f" }
    }
    Write-Host "All $($jsFiles.Count) hand-written JS files: syntax OK" -ForegroundColor Green

    # 4. Translation key parity (a stale key in one language silently breaks
    #    that language's UI - catch it at build time, not by a user report).
    $parityCheck = node -e @"
global.window = {};
require('./src/shared/extractify-i18n.js');
const S = window.ExtractifyI18n.STRINGS;
const en = Object.keys(S.en).sort();
const he = Object.keys(S.he).sort();
const onlyEn = en.filter(k => !he.includes(k));
const onlyHe = he.filter(k => !en.includes(k));
if (onlyEn.length || onlyHe.length) {
  console.error('MISMATCH onlyEn=' + JSON.stringify(onlyEn) + ' onlyHe=' + JSON.stringify(onlyHe));
  process.exit(1);
}
console.log(en.length + ' keys, en/he match');
"@
    if ($LASTEXITCODE -ne 0) { throw "i18n key parity check failed: $parityCheck" }
    Write-Host "Translation keys: $parityCheck" -ForegroundColor Green

    # 5. Clean up any stale versioned ZIP left in the root.
    Get-ChildItem -Path "." -Filter "Extractify-v*.zip" | Remove-Item -Force

    # 6. Rebuild the ZIP from exactly what ships.
    $zipName = "Extractify-v$version.zip"
    $stagingDir = Join-Path $env:TEMP "extractify-build-$([guid]::NewGuid())"
    New-Item -ItemType Directory -Path $stagingDir | Out-Null
    try {
        Copy-Item "manifest.json" $stagingDir
        Copy-Item "src" (Join-Path $stagingDir "src") -Recurse
        Copy-Item "assets" (Join-Path $stagingDir "assets") -Recurse
        Copy-Item "_locales" (Join-Path $stagingDir "_locales") -Recurse
        Compress-Archive -Path "$stagingDir/*" -DestinationPath $zipName -Force
    } finally {
        Remove-Item $stagingDir -Recurse -Force
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zipHandle = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $zipName))
    $zipEntryCount = $zipHandle.Entries.Count
    $zipHandle.Dispose()
    Write-Host "Built $zipName ($zipEntryCount entries)" -ForegroundColor Green

    Write-Host "`n== Build complete: $zipName ==" -ForegroundColor Cyan
}
finally {
    Pop-Location
}
