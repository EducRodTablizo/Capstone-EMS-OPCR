@echo off
echo ============================================
echo  EMS Microservices - Start All Services
echo ============================================
echo.
echo Cleaning up previous zombie processes...
taskkill /f /im node.exe 2>nul
echo.
echo Starting API Gateway on port 3001...
start "API Gateway" cmd /c "cd /d C:\Capstone\Capstone-EMS-OPCR\apps\api-gateway && pnpm start:dev"

timeout /t 2 /nobreak >nul

echo Starting Identity Service on port 3002...
start "Identity Service" cmd /c "cd /d C:\Capstone\Capstone-EMS-OPCR\apps\identity-office-service && pnpm start:dev"

timeout /t 2 /nobreak >nul

echo Starting Transaction Service on port 3003...
start "Transaction Service" cmd /c "cd /d C:\Capstone\Capstone-EMS-OPCR\apps\transaction-pss-service && pnpm start:dev"

timeout /t 2 /nobreak >nul

echo Starting Time Tracking Service on port 3004...
start "Time Tracking Service" cmd /c "cd /d C:\Capstone\Capstone-EMS-OPCR\apps\time-tracking-sla-service && pnpm start:dev"

timeout /t 2 /nobreak >nul

echo Starting Audit Log Service on port 3006...
start "Audit Log Service" cmd /c "cd /d C:\Capstone\Capstone-EMS-OPCR\apps\audit-log-service && pnpm start:dev"

timeout /t 2 /nobreak >nul

echo Starting Dashboard Service on port 3007...
start "Dashboard Service" cmd /c "cd /d C:\Capstone\Capstone-EMS-OPCR\apps\dashboard-reporting-service && pnpm start:dev"

timeout /t 2 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /c "cd /d C:\Capstone\Capstone-EMS-OPCR && pnpm run dev"

echo.
echo ============================================
echo All services started!
echo   Frontend:    http://localhost:5175
echo   API Gateway: http://localhost:3001/api
echo   Identity:    http://localhost:3002
echo   Transaction: http://localhost:3003
echo   Time SLA:    http://localhost:3004
echo   Audit Log:   http://localhost:3006
echo   Dashboard:   http://localhost:3007
echo   Adminer DB:  http://localhost:8080
echo ============================================
pause
