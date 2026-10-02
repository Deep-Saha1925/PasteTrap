# Builds the store-ready zip into dist\ (run from the project root: .\build.ps1)
$version = (Get-Content PasteTrapExtension\manifest.json | ConvertFrom-Json).version
New-Item -ItemType Directory -Force dist | Out-Null
$out = "..\dist\pastetrap-$version.zip"
Push-Location PasteTrapExtension
if (Test-Path $out) { Remove-Item $out }
tar -a -c -f $out manifest.json src icons
Pop-Location
Write-Host "Built dist\pastetrap-$version.zip"
