# BTX3 Admin Panel - Run helper (Windows)
# Run this after the dep fixes:
#   cd Btx3
#   .\run-admin.ps1

$sysNode = "C:\Program Files\nodejs"
$portable = "$env:USERPROFILE\node-portable"

$env:Path = "$sysNode;$portable;$env:Path"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host "Node: $(node --version)" -ForegroundColor Green
& "$sysNode\npm.cmd" --version

Write-Host "`nInstalling (this fixes the previous ERESOLVE by removing unused prisma adapter)..." -ForegroundColor Yellow
& "$sysNode\npm.cmd" install --legacy-peer-deps

Write-Host "`nStarting dev server..." -ForegroundColor Green
& "$sysNode\npm.cmd" run dev
