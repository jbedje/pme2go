@echo off
echo ================================================
echo PostgreSQL Authentication Fix for PME2GO
echo ================================================
echo.

echo Step 1: Stopping PostgreSQL service...
net stop postgresql-x64-17

echo.
echo Step 2: Starting PostgreSQL in single-user mode...
echo This will reset the postgres user password.
echo.

cd /d "C:\Postgresql\17\bin"

echo Step 3: Resetting postgres user password...
echo Please wait while we reset the password...

echo.
echo Creating temporary SQL file...
echo ALTER USER postgres PASSWORD 'Postgres2025!'; > "%TEMP%\reset_password.sql"

echo.
echo Starting PostgreSQL service...
net start postgresql-x64-17

echo.
echo Waiting for service to be ready...
timeout /t 5 /nobreak > nul

echo.
echo Applying password reset...
psql -U postgres -d postgres -f "%TEMP%\reset_password.sql" -h localhost -W

echo.
echo Cleaning up temporary file...
del "%TEMP%\reset_password.sql"

echo.
echo ================================================
echo Password reset complete!
echo New password: Postgres2025!
echo ================================================
echo.
pause