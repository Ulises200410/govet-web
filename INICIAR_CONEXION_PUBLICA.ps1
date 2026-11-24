# Levanta el escritorio GOVET, expone su puente a internet y publica la URL en la web.
# Ejecutar desde PowerShell: powershell -ExecutionPolicy Bypass -File INICIAR_CONEXION_PUBLICA.ps1

$ErrorActionPreference = 'Stop'
$sw = 'C:\Users\Administrador\Documents\NetBeansProjects\SistemaCitasGOVET'
$web = 'C:\Users\Administrador\Documents\Trabajos\7\Gps\Pagina_Web_GOVET'
$tmp = 'C:\Users\Administrador\AppData\Local\Temp\opencode'
$cloudflared = Join-Path $tmp 'cloudflared.exe'
$log = Join-Path $tmp 'cloudflared.log'

if (-not (Test-Path $cloudflared)) {
  Write-Host 'Descargando cloudflared (una sola vez)...'
  Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile $cloudflared
}

Write-Host 'Compilando el sistema...'
$salida = Join-Path $tmp 'compile_publico'
if (Test-Path $salida) { Remove-Item $salida -Recurse -Force }
New-Item -ItemType Directory -Path $salida -Force | Out-Null
$fuentes = Get-ChildItem (Join-Path $sw 'src') -Recurse -Filter *.java |
  Where-Object { $_.Name -notlike '*.bak' } | ForEach-Object { $_.FullName }
Push-Location $sw
javac -encoding UTF-8 -cp 'librerias/*' -d $salida $fuentes
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'La compilación falló; no se levanta nada.' }

Write-Host 'Abriendo la agenda...'
$cp = "$salida;$sw\src;$sw\librerias\*"
$procesoJava = Start-Process -FilePath 'java' `
  -ArgumentList @('--enable-native-access=ALL-UNNAMED', '-cp', $cp, 'sistemacitasgovet.SistemaCitasGOVET') `
  -WorkingDirectory $sw -PassThru
Pop-Location

Write-Host 'Abriendo el túnel público...'
foreach ($archivo in @($log, (Join-Path $tmp 'cloudflared.out.log'))) {
  if (Test-Path $archivo) { Remove-Item $archivo -Force }
}
$procesoTunel = Start-Process -FilePath $cloudflared `
  -ArgumentList @('tunnel', '--no-autoupdate', '--url', 'http://127.0.0.1:8085') `
  -RedirectStandardError $log -RedirectStandardOutput (Join-Path $tmp 'cloudflared.out.log') `
  -PassThru -WindowStyle Hidden

$url = ''
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 2
  if (Test-Path $log) {
    $linea = Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -Last 1
    if ($linea) { $url = $linea.Matches[0].Value; break }
  }
}
if (-not $url) {
  throw 'No se obtuvo la URL del túnel. Revisa el archivo de log y vuelve a intentarlo.'
}

$configuracion = [ordered]@{
  url = $url
  nota = 'URL pública temporal del puente local GOVET. Se regenera con INICIAR_CONEXION_PUBLICA.ps1'
} | ConvertTo-Json
$configuracion | Set-Content (Join-Path $web 'bridge-config.json') -Encoding UTF8

Push-Location $web
git add bridge-config.json
git -c user.name='Empleado' -c user.email='empleado@govet.mx' commit -m 'Actualiza la URL pública del puente GOVET' 2>$null
git push origin main
Pop-Location

Write-Host "Listo. Puente público: $url"
Write-Host "Procesos: Java PID $($procesoJava.Id), túnel PID $($procesoTunel.Id)."
Write-Host 'Déjalos abiertos mientras quieras que la web pueda registrar citas. Al cerrarlos, la URL deja de servir y el asistente cae al teléfono.'
