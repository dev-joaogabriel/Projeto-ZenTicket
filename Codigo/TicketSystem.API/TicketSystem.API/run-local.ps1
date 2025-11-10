<#
run-local.ps1

Carrega variáveis de ambiente a partir de `.env.local` (na mesma pasta do script)
e executa `dotnet run` no projeto. Útil para desenvolvimento local quando você
prefere manter a connection string em `.env.local`.

Uso:
  # Copie o exemplo e edite valores locais
  Copy-Item .\.env.local.example .\.env.local
  # Execute o script (PowerShell)
  .\run-local.ps1

Opções:
  Você pode passar argumentos para `dotnet run`, por exemplo:
  .\run-local.ps1 --urls "http://0.0.0.0:5140"
#>

[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [String[]]
    $DotnetArgs
)

function Load-DotEnvFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        Write-Host ".env.local não encontrado em: $Path" -ForegroundColor Yellow
        return $false
    }

    Write-Host "Carregando variáveis de ambiente de: $Path"
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        if ($line -match '^[ \t]*([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remover aspas simples ou duplas ao redor do valor
            if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'" ) -and $value.EndsWith("'"))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            $env:$name = $value
            Write-Host "  -> $name" -ForegroundColor DarkGreen
        }
        else {
            Write-Host "  (ignorado) Linha inválida: $line" -ForegroundColor DarkYellow
        }
    }
    return $true
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $scriptDir '.env.local'

if (Load-DotEnvFile -Path $envFile) {
    Write-Host "Variáveis carregadas com sucesso. Iniciando aplicação..." -ForegroundColor Green
} else {
    Write-Host "Continuando sem variáveis adicionais. Você pode criar '.env.local' baseado em '.env.local.example' antes de rodar." -ForegroundColor Yellow
}

# Executar dotnet run no diretório do script (TicketSystem.API)
Push-Location $scriptDir
try {
    if ($DotnetArgs -and $DotnetArgs.Length -gt 0) {
        Write-Host "dotnet run $($DotnetArgs -join ' ')" -ForegroundColor Cyan
        dotnet run -- $DotnetArgs
    }
    else {
        Write-Host "dotnet run" -ForegroundColor Cyan
        dotnet run
    }
}
finally {
    Pop-Location
}
