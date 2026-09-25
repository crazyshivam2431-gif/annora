@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "PORT=3000"
:checkport
netstat -ano | findstr ":%PORT% " >nul
if not errorlevel 1 (
  set /a PORT+=1
  if %PORT% GEQ 3010 (
    echo No available local port found in range 3000-3009.
    exit /b 1
  )
  goto checkport
)

echo Starting ANNORA on http://127.0.0.1:%PORT%
call npm.cmd run dev -- --hostname 127.0.0.1 --port %PORT%
