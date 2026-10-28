@echo off
cd C:\School management\apps\api
set NODE_ENV=development
call npm install >nul 2>&1
npx nest start --verbose