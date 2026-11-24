# Cómo ponerle dominio propio a la página de GOVET

La página ya está publicada en `https://ulises200410.github.io/govet-web/`.
Para que se vea en algo como `www.veterinariagovet.com` necesitas comprar un dominio.
Yo me encargo de conectarlo; tú solo sigues estos pasos.

## 1. Comprar el dominio

Opciones recomendadas (precios aproximados por año):

| Proveedor | Sitio | Precio aprox. | Comentario |
|---|---|---|---|
| Namecheap | namecheap.com | $10–12 USD | Fácil de usar, recomendado |
| Cloudflare Registrar | cloudflare.com/registrar | $10 USD | Sin recargos ocultos |
| GoDaddy | godaddy.com | $12–20 USD | Muy conocido |

Nombres sugeridos:
- `veterinariagovet.com` — **verificado libre el 23/nov/2026** ✅
- `govetclinica.com`
- `govet.mx` o `veterinariagovet.com.mx` (si quieres uno mexicano)

**Importante:** compra solo el dominio. No contrates hosting: la página ya está alojada y no cuesta nada.

## 2. Lo que tienes que hacer en la página del proveedor

Cuando ya compres el dominio, entra a la sección **DNS / Zona DNS** y agrega estos registros:

| Tipo | Nombre / Host | Valor / Apunta a |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `ulises200410.github.io` |

Si el proveedor solo te deja poner CNAME, pon `www` → `ulises200410.github.io` y después dime para ajustar el resto.

## 3. Avísame con estos datos

Mándame:
1. El dominio exacto que compraste (ejemplo: `veterinariagovet.com`).
2. Si quieres que funcione con `www`, sin `www` o con ambos.

Con eso yo:
- agrego el archivo `CNAME` al repositorio,
- configuro el dominio en GitHub Pages desde la API,
- y verifico que abra en `https://tu-dominio.com`.

## 4. Tiempo de espera

Los cambios de DNS tardan entre unos minutos y 24 horas en propagarse. Yo te confirmo cuando ya responda.

---

**Respuesta corta:** cómprame un dominio, dime cuál compraste y te dejo la página abriendo ahí. El hospedaje ya está resuelto; no hay que pagar nada más.
