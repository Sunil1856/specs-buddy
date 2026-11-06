@echo off
title SPECS BUDDY - Push to GitHub
cd /d "%~dp0"

echo ===================================================================
echo     SPECS BUDDY - Upload to GitHub (Sunil1856/specs-buddy)
echo ===================================================================
echo.
echo  Make sure you have created the empty repository on GitHub:
echo  Repository URL: https://github.com/Sunil1856/specs-buddy
echo.
echo  Pushing code to main branch...
echo.

git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ===================================================================
    echo  SUCCESS: Code uploaded successfully to GitHub!
    echo  Visit: https://github.com/Sunil1856/specs-buddy
    echo ===================================================================
) else (
    echo ===================================================================
    echo  NOTICE: If the repository does not exist on GitHub yet:
    echo  1. Open: https://github.com/new
    echo  2. Repository name: specs-buddy
    echo  3. Click "Create repository" (Do not add README or .gitignore)
    echo  4. Run this script again!
    echo ===================================================================
)

echo.
pause
