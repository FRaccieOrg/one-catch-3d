@echo off
cd /d "%~dp0"
start "One Catch HTTP Server" cmd /k py -m http.server 8080
timeout /t 2 /nobreak >nul
start "" http://localhost:8080
exit
