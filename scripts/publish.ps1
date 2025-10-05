param(
    [string]$Message
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
    param([Parameter(Mandatory=$true)][string[]]$Args)
    $result = & git @Args 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Args -join ' ') falhou:`n$result"
    }
    return $result
}

try {
    Invoke-Git --version | Out-Null
} catch {
    Write-Error 'Git não foi encontrado no PATH. Instale o Git para continuar.'
    exit 1
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$status = Invoke-Git status --porcelain
if (-not ($status -join '').Trim()) {
    Write-Output 'Nenhuma alteração para enviar. Tudo sincronizado.'
    exit 0
}

Invoke-Git add --all

if (-not $Message) {
    $Message = "auto: sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Invoke-Git commit -m $Message | Out-Null
Invoke-Git push | Out-Null

Write-Output 'Alterações enviadas com sucesso para o GitHub.'
