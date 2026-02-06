# FilmVault Development Environment Initialization Script
# This script sets up the environment for local development

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FilmVault Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# VS Build Tools environment initialization
$vsDevCmd = "D:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

if (Test-Path $vsDevCmd) {
    Write-Host "[1/2] Loading Visual Studio Build Tools environment..." -ForegroundColor Yellow
    cmd /c "`"$vsDevCmd`" && set" | ForEach-Object {
        if ($_ -match "(.*?)=(.*)") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "        Visual Studio Build Tools loaded." -ForegroundColor Green
} else {
    Write-Host "        Warning: VS Build Tools not found at $vsDevCmd" -ForegroundColor Red
    exit 1
}

# Add Rust to PATH
$rustPath = "C:\Users\dylan\.cargo\bin"
if ($env:PATH -notlike "*$rustPath*") {
    Write-Host "[2/2] Adding Rust to PATH..." -ForegroundColor Yellow
    $env:PATH += ";$rustPath"
    Write-Host "        Rust added to PATH." -ForegroundColor Green
}

Write-Host ""
Write-Host "Development environment ready!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development server, run:" -ForegroundColor Cyan
Write-Host "  npm run tauri:dev" -ForegroundColor White
Write-Host ""
