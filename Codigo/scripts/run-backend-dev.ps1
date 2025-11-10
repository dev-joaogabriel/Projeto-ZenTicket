# Usage: Copy TicketSystem.API\TicketSystem.API\.env.local.example -> TicketSystem.API\TicketSystem.API\.env.local
# Then run this script from repo root in PowerShell: .\scripts\run-backend-dev.ps1

$envFile = Join-Path -Path $PSScriptRoot -ChildPath "..\TicketSystem.API\TicketSystem.API\.env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "Env file not found: $envFile" -ForegroundColor Yellow
    Write-Host "Create it by copying .env.local.example and filling values. Exiting." -ForegroundColor Yellow
    exit 1
}

# Read key=value lines, support comments (#)
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $parts = $line -split "=",2
    if ($parts.Count -lt 2) { return }
    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')
    Write-Host "Setting env: $name"
    # Set for current process
    $env:$name = $value
}

# Run backend
Write-Host "Starting backend with environment vars from: $envFile" -ForegroundColor Green
Write-Host "If you want hot reload, you can run 'dotnet watch run' instead of 'dotnet run'." -ForegroundColor Green

dotnet run --project "TicketSystem.API\TicketSystem.API\TicketSystem.API.csproj" --no-launch-profile
