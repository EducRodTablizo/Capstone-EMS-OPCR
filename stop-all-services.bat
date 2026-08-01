@echo off
echo ============================================
echo  EMS Microservices - Stop All Services
echo ============================================
echo.
echo Stopping Docker containers...
cd /d C:\Capstone\Capstone-EMS-OPCR
docker compose down 2>nul

echo.
echo Stopping all Node.js services and Frontend...
taskkill /f /im node.exe 2>nul

echo.
echo ============================================
echo All EMS services and Node processes stopped!
echo ============================================
pause
