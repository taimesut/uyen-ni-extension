@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Download Node.js from https://nodejs.org/
  pause
  exit /b 1
)

node "scripts\build-userscript.cjs"
set "BUILD_EXIT_CODE=%ERRORLEVEL%"
echo.
if not "%BUILD_EXIT_CODE%"=="0" (
  echo [ERROR] Userscript build failed.
) else (
  echo [OK] Userscript build complete.
)
pause
exit /b %BUILD_EXIT_CODE%
