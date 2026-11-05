@echo off
REM ================================================
REM  BTMeals — Local Database Setup Script
REM  Run this AFTER installing PostgreSQL
REM ================================================

echo.
echo  BTMeals Local Setup
echo  ===========================
echo.

REM === Step 1: Check PostgreSQL is accessible ===
echo [1/4] Checking PostgreSQL connection...
set PGPASSWORD=%~1
if "%~1"=="" set PGPASSWORD=yourpassword

psql -U postgres -c "SELECT version();" >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Cannot connect to PostgreSQL!
    echo  Make sure PostgreSQL is installed and running.
    echo  Usage: setup-local.bat [your_postgres_password]
    echo.
    pause
    exit /b 1
)
echo  PostgreSQL connection OK

REM === Step 2: Create database ===
echo.
echo [2/4] Creating database 'btmeals_db'...
psql -U postgres -c "CREATE DATABASE btmeals_db;" 2>nul
echo  Database ready (may already exist - that's OK)

REM === Step 3: Update .env with password ===
echo.
echo [3/4] Updating .env with your password...
powershell -ExecutionPolicy Bypass -Command "(Get-Content .env) -replace 'yourpassword', '%PGPASSWORD%' | Set-Content .env"
echo  .env updated

REM === Step 4: Run Prisma migrations and seed ===
echo.
echo [4/4] Running database migrations and seed...
call npm run db:push
if errorlevel 1 (
    echo  ERROR: Migration failed! Check your DATABASE_URL in .env
    pause
    exit /b 1
)

call npm run db:seed
if errorlevel 1 (
    echo  ERROR: Seed failed!
    pause
    exit /b 1
)

echo.
echo  ================================
echo   Setup Complete!
echo  ================================
echo.
echo   Admin Login:
echo     Phone:    9999999999
echo     Password: admin@123
echo.
echo   Now start the server with:
echo     npm run dev
echo.
pause
