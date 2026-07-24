$ErrorActionPreference = "Stop"

$repo = "https://github.com/reisprints-coder/gestao-segura-sst.git"
$temp = Join-Path $env:TEMP ("gestao-segura-sst-" + [guid]::NewGuid().ToString("N"))

Write-Host "Clonando o repositório..." -ForegroundColor Cyan
git clone $repo $temp
if ($LASTEXITCODE -ne 0) { throw "Falha ao clonar o repositório." }

Write-Host "Copiando a versão final..." -ForegroundColor Cyan
robocopy $PSScriptRoot $temp /E /PURGE /XD .git /XF PUBLICAR_NO_GITHUB.ps1 PUBLICAR_NO_GITHUB.bat
if ($LASTEXITCODE -ge 8) { throw "Falha ao copiar os arquivos." }

Push-Location $temp
try {
  git add -A
  git commit -m "feat: conectar Gestão Segura SST ao Supabase e publicar"
  if ($LASTEXITCODE -ne 0) { Write-Host "Nenhuma alteração nova para registrar." -ForegroundColor Yellow }
  git push origin main
  if ($LASTEXITCODE -ne 0) { throw "Falha ao enviar para o GitHub." }
} finally {
  Pop-Location
}

Write-Host "" 
Write-Host "PUBLICADO COM SUCESSO" -ForegroundColor Green
Write-Host "Repositório: https://github.com/reisprints-coder/gestao-segura-sst"
Write-Host "Site: https://reisprints-coder.github.io/gestao-segura-sst/"
Read-Host "Pressione Enter para fechar"
