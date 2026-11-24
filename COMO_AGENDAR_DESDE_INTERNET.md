# Agendar desde internet con el sistema GOVET

La página pública puede registrar citas directamente en la agenda del escritorio. No hay base en la nube ni cuentas nuevas: tu MySQL local sigue siendo la fuente de datos.

## Cómo funciona

1. El escritorio levanta un puente HTTP en `127.0.0.1:8085` (`Modelo/PuenteWeb.java`). Usa los mismos DAO y validaciones que el sistema; no crea registros nuevos ni cambia reglas.
2. Un túnel de Cloudflare expone ese puerto con una URL pública temporal.
3. La web lee esa URL de `bridge-config.json` y el asistente envía la cita hasta ahí.
4. La cita queda en `citas` y `detalle_citas`, con folio, igual que si la hubiera capturado una recepcionista.

## Ponerlo en marcha

En esta computadora, con el proyecto descargado:

```
powershell -ExecutionPolicy Bypass -File INICIAR_CONEXION_PUBLICA.ps1
```

El script compila, abre el escritorio, abre el túnel, escribe la URL en `bridge-config.json` y la publica en GitHub Pages. No cierres esas dos ventanas/procesos mientras quieras recibir citas.

## Puntos que conviene saber

- La URL `*.trycloudflare.com` **cambia en cada arranque**. Por eso se publica en un archivo y se actualiza sola.
- Si el escritorio o el túnel se cierran, el asistente detecta que no hay puente y ofrece el teléfono `755 123 4567`. No se pierde la intención de la persona.
- El asistente solo aparta citas para **tutores y mascotas ya registrados** en el sistema. Si no los encuentra, responde con el teléfono para darlos de alta; así no se inventan fichas desde la web.
- El veterinario asignado es el primero activo del catálogo, igual que en el flujo normal de alta.
- El túnel es una solución de demostración: no tiene autenticación. Para un despliegue real haría falta un backend con cuentas y una base administrada.
