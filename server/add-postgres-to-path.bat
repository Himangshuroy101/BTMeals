@echo off
REM ============================================
REM  BTMeals — Add PostgreSQL to Windows PATH
REM  Run this if 'psql' is not recognized
REM ============================================

echo Searching for PostgreSQL installation...

REM Check common install paths
if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
    set PG_BIN=C:\Program Files\PostgreSQL\17\bin
) else if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    set PG_BIN=C:\Program Files\PostgreSQL\16\bin
) else if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    set PG_BIN=C:\Program Files\PostgreSQL\15\bin
) else (
    echo PostgreSQL not found! Please install it first.
    echo Download from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo Found PostgreSQL at: %PG_BIN%
echo Adding to system PATH...

powershell -ExecutionPolicy Bypass -Command "[System.Environment]::SetEnvironmentVariable('Path', [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';%PG_BIN%', 'Machine')"

echo.
echo Done! Please CLOSE and RE-OPEN your terminal window.
echo Then run: psql --version
echo.
pause
