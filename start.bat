@echo off
setlocal

REM Sprawdzenie, czy Node.js jest zainstalowany
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js nie jest zainstalowany. Rozpoczynam instalację.
    REM Pobieranie instalatora Node.js
    bitsadmin /transfer "NodeInstall" https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi %temp%\nodejs.msi
    REM Instalacja Node.js
    msiexec /i %temp%\nodejs.msi /quiet /norestart
    REM Sprawdzenie, czy instalacja się powiodła
    node -v >nul 2>&1
    if %errorlevel% neq 0 (
        echo Instalacja Node.js nie powiodła się. Sprawdź połączenie internetowe lub spróbuj ponownie.
        exit /b 1
    )
)

echo Node.js jest zainstalowany.

REM Przechodzenie do katalogu SRC
cd /d %~dp0SRC

REM Uruchamianie skryptu Node.js
node app.js

endlocal
