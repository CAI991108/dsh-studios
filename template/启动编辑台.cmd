@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Please install Node.js 22 or newer from https://nodejs.org and retry.
  pause
  exit /b 1
)
node scripts/launch.cjs
pause
