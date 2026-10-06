$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Test-Path '.venv/Scripts/python.exe')) { Write-Error 'Run the Windows setup commands in README.md first.' }
& '.venv/Scripts/python.exe' -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
