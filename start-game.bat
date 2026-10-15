@echo off
setlocal
cd /d "%~dp0"

set "GAME_URL=http://127.0.0.1:5173/"

where node >nul 2>&1
if errorlevel 1 (
  echo Khong tim thay Node.js trong PATH.
  echo Hay cai Node.js LTS, sau do dong va mo lai cua so Command Prompt.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\vite.cmd" (
  echo Chua co Vite trong node_modules.
  echo Mo PowerShell tai thu muc D:\game va chay: pnpm install
  pause
  exit /b 1
)

call :checkServer
if not errorlevel 1 goto openGame

echo Dang khoi dong may chu Mini War...
start "Mini War - may chu" cmd /k "cd /d ""%~dp0"" && call node_modules\.bin\vite.cmd --host 127.0.0.1 --port 5173"

set /a attempts=0
:waitForServer
call :checkServer
if not errorlevel 1 goto openGame
set /a attempts+=1
if %attempts% GEQ 20 goto serverFailed
timeout /t 1 /nobreak >nul
goto waitForServer

:checkServer
set "GAME_PORT="
for /f "delims=" %%P in ('powershell -NoProfile -Command "foreach ($p in 5173..5180) { try { $r = Invoke-WebRequest -Uri ('http://127.0.0.1:' + $p + '/') -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200 -and $r.Content -match 'Mini War') { Write-Output $p; exit 0 } } catch {} }; exit 1"') do set "GAME_PORT=%%P"
if not defined GAME_PORT exit /b 1
set "GAME_URL=http://127.0.0.1:%GAME_PORT%/"
exit /b 0

:openGame
echo Mini War da san sang tai %GAME_URL%
start "" "%GAME_URL%"
exit /b 0

:serverFailed
echo Khong the khoi dong may chu tai cong 5173.
echo Kiem tra cua so "Mini War - may chu" de xem loi cu the.
echo Neu cong 5173 dang duoc ung dung khac su dung, hay dong ung dung do roi thu lai.
pause
exit /b 1
