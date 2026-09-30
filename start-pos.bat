@echo off
title BiteFlow - Offline Restaurant Management System
echo ============================================================
echo   BiteFlow Offline Restaurant POS & Management System
echo ============================================================
echo.
echo Starting MongoDB local service if not already active...
net start MongoDB >nul 2>&1

echo Starting BiteFlow POS Local Server on http://localhost:5000 ...
cd backend
start http://localhost:5000
node server.js
pause
