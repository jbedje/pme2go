# PostgreSQL Password Reset Script for PME2GO
Write-Host "=============================================" -ForegroundColor Green
Write-Host "PostgreSQL Password Reset for PME2GO" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

$POSTGRES_BIN = "C:\Postgresql\17\bin"
$NEW_PASSWORD = "Postgres2025!"

Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow

if (!(Test-Path "$POSTGRES_BIN\psql.exe")) {
    Write-Host "ERROR: PostgreSQL not found at expected location." -ForegroundColor Red
    Write-Host "Please check if PostgreSQL is installed in C:\Postgresql\17\" -ForegroundColor Red
    exit 1
}

Write-Host "Found PostgreSQL installation." -ForegroundColor Green
Write-Host ""

# Method 1: Try to connect and change password
Write-Host "Method 1: Attempting password change via SQL..." -ForegroundColor Yellow

# Create SQL command
$sqlCommand = "ALTER USER postgres PASSWORD '$NEW_PASSWORD';"
$sqlFile = "$env:TEMP\reset_postgres_password.sql"

# Write SQL to temp file
$sqlCommand | Out-File -FilePath $sqlFile -Encoding UTF8

try {
    # Try to execute the password change
    $process = Start-Process -FilePath "$POSTGRES_BIN\psql.exe" `
        -ArgumentList "-U postgres", "-d postgres", "-f $sqlFile", "-h localhost" `
        -Wait -PassThru -NoNewWindow

    if ($process.ExitCode -eq 0) {
        Write-Host "SUCCESS: Password changed successfully!" -ForegroundColor Green
        Write-Host "New password: $NEW_PASSWORD" -ForegroundColor Green
        Remove-Item $sqlFile -ErrorAction SilentlyContinue
        
        # Test the new connection
        Write-Host ""
        Write-Host "Testing new connection..." -ForegroundColor Yellow
        
        # Set environment variable for password
        $env:PGPASSWORD = $NEW_PASSWORD
        
        $testProcess = Start-Process -FilePath "$POSTGRES_BIN\psql.exe" `
            -ArgumentList "-U postgres", "-d postgres", "-h localhost", "-c", "SELECT version();" `
            -Wait -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\pg_test_output.txt"
            
        if ($testProcess.ExitCode -eq 0) {
            Write-Host "SUCCESS: Connection test passed!" -ForegroundColor Green
            Write-Host ""
            Write-Host "PostgreSQL is now ready for PME2GO!" -ForegroundColor Green
            Write-Host "You can now run: npm run migrate" -ForegroundColor Cyan
        } else {
            Write-Host "WARNING: Password changed but connection test failed." -ForegroundColor Yellow
            Write-Host "You may need to restart PostgreSQL service." -ForegroundColor Yellow
        }
        
        # Clean up
        Remove-Item "$env:TEMP\pg_test_output.txt" -ErrorAction SilentlyContinue
        
    } else {
        Write-Host "Method 1 failed. Trying alternative approach..." -ForegroundColor Yellow
        
        # Method 2: Service restart approach
        Write-Host ""
        Write-Host "Method 2: Restarting PostgreSQL service..." -ForegroundColor Yellow
        
        # Stop service
        Write-Host "Stopping PostgreSQL service..."
        Stop-Service -Name "postgresql-x64-17" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        
        # Start service
        Write-Host "Starting PostgreSQL service..."
        Start-Service -Name "postgresql-x64-17"
        Start-Sleep -Seconds 5
        
        Write-Host "Service restarted. Please try running the password reset again." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "ERROR: Failed to change password - $_" -ForegroundColor Red
    
    # Method 3: Manual instructions
    Write-Host ""
    Write-Host "Manual Reset Instructions:" -ForegroundColor Yellow
    Write-Host "1. Open Command Prompt as Administrator" -ForegroundColor White
    Write-Host "2. Run: net stop postgresql-x64-17" -ForegroundColor White
    Write-Host "3. Run: net start postgresql-x64-17" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
}

# Clean up temp file
Remove-Item $sqlFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Script completed." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green