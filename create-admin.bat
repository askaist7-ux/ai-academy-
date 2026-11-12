@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  AI Academy - create admin account (ID: kaistweb)
echo.
where node >/dev/null 2>nul
if errorlevel 1 (
  echo  Node.js not found. Install from https://nodejs.org then run again.
  pause
  exit /b 1
)
set /p ADMIN_PASSWORD= Enter admin password and press Enter: 
node scripts\setup-admin.mjs
echo.
pause
