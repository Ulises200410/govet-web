# Crea la narización del vídeo explicativo con la voz española que ya trae Windows.
# No baja nada de internet y no añade dependencias al proyecto.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$assets = Join-Path $PSScriptRoot 'assets'
$partes = Join-Path $env:TEMP 'govet_narizacion_partes'
New-Item -ItemType Directory -Path $partes -Force | Out-Null

$frases = @(
  'Veterinaria GOVET, en Tlapa de Comonfort.',
  'Consulta, vacunación, desparasitación, baño, cirugía menor y ultrasonido.',
  'Agenda al 755 123 4567 y te damos hora.',
  'Comprobante en PDF con folio y total.'
)

$sintetizador = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voz = $sintetizador.GetInstalledVoices() | Where-Object {
  $_.VoiceInfo.Culture -like 'es-*' -and $_.Enabled
} | Select-Object -First 1
if (-not $voz) { throw 'Windows no tiene ninguna voz en español instalada.' }
$sintetizador.SelectVoice($voz.VoiceInfo.Name)
$sintetizador.Rate = 6
$formato = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)

for ($i = 0; $i -lt $frases.Count; $i++) {
  $archivo = Join-Path $partes ("frase" + ($i + 1) + ".wav")
  $sintetizador.SetOutputToWaveFile($archivo, $formato)
  $sintetizador.Speak($frases[$i])
  Write-Host ("Voz lista: frase " + ($i + 1))
}
$sintetizador.SetOutputToNull()
$sintetizador.Dispose()

$destino = Join-Path $assets 'govet_narizacion.wav'
$python = @'
import os, wave, struct
parte = os.path.join(os.environ['TEMP'], 'govet_narizacion_partes')
salida = os.path.join(os.environ['GOVET_WEB'], 'assets', 'govet_narizacion.wav')
pausa = 0.28
datos = []
info = None
for n in range(1, 5):
    with wave.open(os.path.join(parte, 'frase%d.wav' % n), 'rb') as w:
        if info is None:
            info = (w.getnchannels(), w.getsampwidth(), w.getframerate())
        datos.append(w.readframes(w.getnframes()))
canales, ancho, tasa = info
silencio = b'\x00' * (int(pausa * tasa) * canales * ancho)
contenido = b''
marcas = []
tiempo = 0.0
for i, d in enumerate(datos):
    marcas.append(tiempo)
    contenido += d
    if i < len(datos) - 1:
        contenido += silencio
        tiempo += len(d) / (canales * ancho * tasa) + pausa
    else:
        tiempo += len(d) / (canales * ancho * tasa)
with wave.open(salida, 'wb') as w:
    w.setnchannels(canales); w.setsampwidth(ancho); w.setframerate(tasa)
    w.writeframes(contenido)
def vtt(t):
    m = int(t // 60); s = t % 60
    return '%02d:%06.3f' % (m, s)
print('NARIZACION=%.2fs' % tiempo)
for i, m in enumerate(marcas):
    fin = marcas[i+1] if i+1 < len(marcas) else tiempo
    print('CUEDA%d=%s --> %s' % (i+1, vtt(m), vtt(fin)))
'@
$env:GOVET_WEB = $PSScriptRoot
$env:TEMP = $env:TEMP
python -c $python
Remove-Item -Path $partes -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Narización lista: $destino"
