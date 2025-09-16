@echo off
title Blockchain Nodes - Single Terminal

echo Checking and closing existing processes...

for /f "tokens=5" %%a in ('netstat -a -n -o ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -a -n -o ^| findstr :6001') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -a -n -o ^| findstr :3002') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -a -n -o ^| findstr :6002') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -a -n -o ^| findstr :3003') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -a -n -o ^| findstr :6003') do taskkill /F /PID %%a >nul 2>&1

echo Existing processes cleared.
echo Starting all nodes...

:: Start Node 1
start /B cmd /c "set HTTP_PORT=3001 && set P2P_PORT=6001 && node server.js >node1.log 2>&1"

timeout /t 1 /nobreak >nul

:: Start Node 2
start /B cmd /c "set HTTP_PORT=3002 && set P2P_PORT=6002 && set PEERS=ws://localhost:6001 && node server.js >node2.log 2>&1"

timeout /t 1 /nobreak >nul

:: Start Node 3
start /B cmd /c "set HTTP_PORT=3003 && set P2P_PORT=6003 && set PEERS=ws://localhost:6001,ws://localhost:6002 && node server.js >node3.log 2>&1"

echo All blockchain nodes started!
echo Logs are saved in node1.log, node2.log, and node3.log
pause
