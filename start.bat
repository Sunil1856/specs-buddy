@echo off
title SPECS BUDDY - WhatsApp Marketing Suite
cd /d "%~dp0"

echo ===================================================================
echo     SPECS BUDDY - WhatsApp Marketing ^& CRM Portal
echo ===================================================================
echo.
echo  Starting application server on http://localhost:3000 ...
echo.
echo  Default Login Credentials:
echo    Email:    admin@specsbuddy.com
echo    Password: SpecsBuddy@2026
echo.
echo ===================================================================
echo.

:: Automatically open browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Start the Next.js server
call npm run start
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Production start encountered an issue. Starting in dev mode...
    call npm run dev
)

pause
