// Menú móvil: abre y cierra la navegación según el ancho de la ventana.
const botonMenu = document.querySelector('.menu-toggle');
const navegacion = document.getElementById('navegacion');

function cerrarMenu() {
  navegacion.classList.remove('abierto');
  botonMenu.setAttribute('aria-expanded', 'false');
  botonMenu.setAttribute('aria-label', 'Abrir menú');
}

botonMenu.addEventListener('click', () => {
  const abierto = navegacion.classList.toggle('abierto');
  botonMenu.setAttribute('aria-expanded', String(abierto));
  botonMenu.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
});

navegacion.addEventListener('click', (evento) => {
  if (evento.target.tagName === 'A') cerrarMenu();
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') cerrarMenu();
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) cerrarMenu();
});

// Botón de volver arriba: aparece al bajar y regresa al inicio.
const botonArriba = document.querySelector('.btn-arriba');

function actualizarBotonArriba() {
  botonArriba.classList.toggle('visible', window.scrollY > 420);
}

window.addEventListener('scroll', actualizarBotonArriba, { passive: true });
actualizarBotonArriba();

botonArriba.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Resalta en el menú la sección que se está leyendo.
const enlaces = Array.from(navegacion.querySelectorAll('a'));
const secciones = enlaces
  .map((enlace) => document.querySelector(enlace.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const observadorActivo = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      enlaces.forEach((enlace) => {
        const activo = enlace.getAttribute('href') === '#' + entrada.target.id;
        enlace.classList.toggle('activo', activo);
        if (activo) enlace.setAttribute('aria-current', 'location');
        else enlace.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  secciones.forEach((seccion) => observadorActivo.observe(seccion));
}

// Asistente: usa los servicios que ya están en la página y, si el sistema
// GOVET está encendido en esta máquina, manda la cita a su agenda.
const chatAbrir = document.getElementById('chatAbrir');
const chatCerrar = document.getElementById('chatCerrar');
const chatPanel = document.getElementById('chatPanel');
const chatMensajes = document.getElementById('chatMensajes');
const chatRespuestas = document.getElementById('chatRespuestas');
const chatForm = document.getElementById('chatForm');
const chatEntrada = document.getElementById('chatEntrada');

const servicios = Array.from(document.querySelectorAll('.tarjeta-servicio')).map((tarjeta) => ({
  codigo: tarjeta.querySelector('.codigo').textContent.trim(),
  nombre: tarjeta.querySelector('h3').textContent.trim(),
  precio: tarjeta.querySelector('.precio').textContent.trim(),
  duracion: tarjeta.querySelector('.duracion').textContent.trim()
}));

let paso = 'inicio';
let borrador = {};
let puentePublico = '';

// Si la página se recarga, lo ya escrito no se pierde: queda en la sesión.
const CLAVE_PROGRESO = 'govet_progreso_cita';

function guardarProgreso() {
  try { sessionStorage.setItem(CLAVE_PROGRESO, JSON.stringify({ paso, borrador })); }
  catch (e) { /* algunos navegadores bloquean el almacenamiento */ }
}
function leerProgreso() {
  try {
    const guardado = sessionStorage.getItem(CLAVE_PROGRESO);
    return guardado ? JSON.parse(guardado) : null;
  } catch (e) { return null; }
}
function borrarProgreso() {
  try { sessionStorage.removeItem(CLAVE_PROGRESO); } catch (e) { /* igual */ }
}

// La URL del túnel cambia en cada arranque: se lee de un archivo público y
// mientras tanto se usa el puente local de la propia máquina.
fetch('bridge-config.json?v=' + Date.now(), { cache: 'no-store' })
  .then((respuesta) => respuesta.ok ? respuesta.json() : null)
  .then((config) => { if (config && config.url) puentePublico = config.url.replace(/\/$/, ''); })
  .catch(() => { puentePublico = ''; });

function decir(texto, quien) {
  const burbuja = document.createElement('p');
  burbuja.className = quien === 'yo' ? 'yo' : 'bot';
  burbuja.textContent = texto;
  chatMensajes.appendChild(burbuja);
  chatMensajes.scrollTop = chatMensajes.scrollHeight;
}

function ofrecer(opciones) {
  chatRespuestas.replaceChildren();
  opciones.forEach((opcion) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = opcion.etiqueta;
    boton.addEventListener('click', () => {
      decir(opcion.etiqueta, 'yo');
      elegir(opcion.valor);
    });
    chatRespuestas.appendChild(boton);
  });
}

function pedirTexto(etiqueta, tipo) {
  chatRespuestas.replaceChildren();
  chatForm.hidden = false;
  chatEntrada.type = tipo || 'text';
  chatEntrada.value = '';
  if (tipo === 'date') {
    chatEntrada.min = new Date().toISOString().slice(0, 10);
  }
  paso = etiqueta;
  guardarProgreso();
  decir(tipo === 'date'
    ? '¿Para qué fecha? Usa el selector que aparece abajo.'
    : etiqueta === 'tutor'
      ? '¿Cómo está registrado el tutor en la clínica?'
      : '¿Cómo se llama la mascota?');
  chatEntrada.focus();
}

function horasDisponibles() {
  const horas = [];
  for (let h = 8; h <= 19; h++) {
    horas.push(String(h).padStart(2, '0') + ':00');
    horas.push(String(h).padStart(2, '0') + ':30');
  }
  return horas;
}

function elegir(valor) {
  if (valor === 'inicio') { paso = 'inicio'; saludar(); return; }
  if (valor === 'continuar') { continuar(); return; }
  if (valor === 'servicios') {
    servicios.forEach((s) => decir(s.codigo + ' · ' + s.nombre + ' · ' + s.precio + ' · ' + s.duracion));
    decir('Los precios y duraciones son los mismos de la sección Servicios.');
    ofrecer([{ etiqueta: 'Agendar una cita', valor: 'agendar' }, { etiqueta: 'Volver al inicio', valor: 'inicio' }]);
    return;
  }
  if (valor === 'telefono') {
    decir('Llámanos al 755 123 4567. Ahí registramos la cita y te damos la hora.');
    ofrecer([{ etiqueta: 'Volver al inicio', valor: 'inicio' }]);
    return;
  }
  if (valor === 'agendar') {
    ofrecer(servicios.map((s) => ({
      etiqueta: s.nombre + ' · ' + s.precio,
      valor: s.codigo
    })));
    paso = 'servicio';
    return;
  }
  if (paso === 'servicio') {
    borrador.servicio = valor;
    guardarProgreso();
    const elegido = servicios.find((s) => s.codigo === valor);
    decir('Anotado: ' + elegido.nombre + ' (' + elegido.precio + ').');
    pedirTexto('fecha', 'date');
    return;
  }
  if (valor === 'confirmar') { enviarCita(); return; }
  if (valor === 'rehacer') {
    borrador = {};
    borrarProgreso();
    decir('Vamos de nuevo.');
    paso = 'inicio';
    saludar();
    return;
  }
}

function continuar() {
  if (paso === 'fecha') { pedirTexto('fecha', 'date'); return; }
  if (paso === 'hora') {
    decir('¿A qué hora?');
    ofrecer(horasDisponibles().map((h) => ({ etiqueta: h, valor: h })));
    return;
  }
  if (paso === 'tutor' || paso === 'mascota') {
    pedirTexto(paso, 'text');
    return;
  }
  if (paso === 'confirmar') {
    const s = servicios.find((item) => item.codigo === borrador.servicio);
    decir('Confirmo: ' + borrador.mascota + ', ' + borrador.tutor + ', ' + s.nombre
      + ', el ' + borrador.fecha + ' a las ' + borrador.hora + '. Total ' + s.precio + '.');
    ofrecer([
      { etiqueta: 'Confirmar cita', valor: 'confirmar' },
      { etiqueta: 'Empezar de nuevo', valor: 'rehacer' }
    ]);
    return;
  }
  paso = 'inicio';
  saludar();
}

function saludar() {
  chatForm.hidden = true;
  decir('Qué gusto verte. Puedo mostrarte los servicios o ayudarte a apartar una cita.');
  ofrecer([
    { etiqueta: 'Agendar una cita', valor: 'agendar' },
    { etiqueta: 'Ver servicios y precios', valor: 'servicios' },
    { etiqueta: 'Hablar por teléfono', valor: 'telefono' }
  ]);
}

chatForm.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const texto = chatEntrada.value.trim();
  if (!texto) return;
  decir(texto, 'yo');
  chatForm.hidden = true;

  if (paso === 'fecha') {
    borrador.fecha = texto;
    paso = 'hora';
    guardarProgreso();
    decir('¿A qué hora?');
    ofrecer(horasDisponibles().map((h) => ({ etiqueta: h, valor: h })));
  } else if (paso === 'tutor') {
    borrador.tutor = texto;
    guardarProgreso();
    pedirTexto('mascota', 'text');
  } else if (paso === 'mascota') {
    borrador.mascota = texto;
    guardarProgreso();
    const s = servicios.find((item) => item.codigo === borrador.servicio);
    paso = 'confirmar';
    decir('Confirmo: ' + borrador.mascota + ', ' + borrador.tutor + ', ' + s.nombre
      + ', el ' + borrador.fecha + ' a las ' + borrador.hora + '. Total ' + s.precio + '.');
    ofrecer([
      { etiqueta: 'Confirmar cita', valor: 'confirmar' },
      { etiqueta: 'Empezar de nuevo', valor: 'rehacer' }
    ]);
  }
});

// La hora se elige con botones; el resto se escribe.
const elegirOriginal = elegir;
elegir = function (valor) {
  if (paso === 'hora' && /^\d{2}:(00|30)$/.test(valor)) {
    borrador.hora = valor;
    guardarProgreso();
    pedirTexto('tutor', 'text');
    return;
  }
  elegirOriginal(valor);
};

function destinoPuente() {
  if (puentePublico) return puentePublico;
  const local = location.protocol === 'file:'
    || location.protocol === 'oc-preview:'
    || location.hostname === 'localhost'
    || location.hostname === '127.0.0.1';
  return local ? 'http://127.0.0.1:8085' : '';
}

async function enviarCita() {
  const destino = destinoPuente();
  if (!destino) {
    decir('Ahora mismo no encontramos la agenda en línea. Llámanos al 755 123 4567 y la registramos nosotros.');
    ofrecer([{ etiqueta: 'Ver servicios', valor: 'servicios' }]);
    return;
  }
  decir('Mandando la cita a la agenda...');
  // La misma clave acompaña a los reintentos: si la red se cae a mitad de
  // camino, el puente no registra dos veces la misma cita.
  if (!borrador.clave) {
    borrador.clave = 'govet-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }
  guardarProgreso();
  const cuerpo = new URLSearchParams({
    tutor: borrador.tutor,
    mascota: borrador.mascota,
    servicio: borrador.servicio,
    fecha: borrador.fecha,
    hora: borrador.hora,
    clave: borrador.clave
  });
  chatRespuestas.replaceChildren();

  for (let intento = 0; intento < 3; intento++) {
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), 9000);
    try {
      const respuesta = await fetch(destino + '/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: cuerpo.toString(),
        cache: 'no-store',
        signal: control.signal
      });
      clearTimeout(temporizador);
      const resultado = await respuesta.json();
      decir(resultado.mensaje);
      if (resultado.ok) {
        decir('El folio ya quedó registrado en el sistema de la clínica.');
        borrarProgreso();
        ofrecer([{ etiqueta: 'Agendar otra cita', valor: 'rehacer' }, { etiqueta: 'Volver al inicio', valor: 'inicio' }]);
      } else {
        ofrecer([{ etiqueta: 'Reintentar', valor: 'confirmar' }, { etiqueta: 'Empezar de nuevo', valor: 'rehacer' }]);
      }
      return;
    } catch (error) {
      clearTimeout(temporizador);
      if (intento === 2) {
        decir('No encontré el sistema GOVET encendido. Enciéndelo y vuelve a intentarlo, o llama al 755 123 4567.');
        ofrecer([{ etiqueta: 'Reintentar', valor: 'confirmar' }]);
        return;
      }
      decir('No respondió; lo intento otra vez.');
      await new Promise((resolver) => setTimeout(resolver, 500 * (intento + 1)));
    }
  }
}

function abrirChat() {
  chatPanel.hidden = false;
  chatAbrir.setAttribute('aria-expanded', 'true');
  chatAbrir.setAttribute('aria-label', 'Cerrar asistente GOVET');
  if (chatMensajes.childElementCount) return;
  const guardado = leerProgreso();
  if (!guardado || !guardado.borrador || !guardado.borrador.servicio) {
    saludar();
    return;
  }
  paso = guardado.paso || 'confirmar';
  borrador = guardado.borrador;
  const elegido = servicios.find((s) => s.codigo === borrador.servicio);
  decir('Retomamos lo que dejaste: ' + borrador.mascota + ', ' + borrador.tutor
    + ', ' + (elegido ? elegido.nombre : borrador.servicio)
    + (borrador.fecha ? ', el ' + borrador.fecha : '')
    + (borrador.hora ? ' a las ' + borrador.hora : '') + '.');
  ofrecer([
    { etiqueta: 'Seguir donde iba', valor: 'continuar' },
    { etiqueta: 'Empezar de nuevo', valor: 'rehacer' }
  ]);
}
function cerrarChat() {
  chatPanel.hidden = true;
  chatAbrir.setAttribute('aria-expanded', 'false');
  chatAbrir.setAttribute('aria-label', 'Abrir asistente GOVET');
  chatAbrir.focus();
}

chatAbrir.addEventListener('click', () => chatPanel.hidden ? abrirChat() : cerrarChat());
chatCerrar.addEventListener('click', cerrarChat);
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && !chatPanel.hidden) cerrarChat();
});

// Tarjetas de servicios: el botón o un clic en la tarjeta las volta.
// El frente y el dorso se turnan también para quien lee la página con lector.
document.querySelectorAll('.tarjeta-servicio').forEach((tarjeta) => {
  const boton = tarjeta.querySelector('.girar');
  const frente = tarjeta.querySelector('.cara.frente');
  const dorso = tarjeta.querySelector('.cara.dorso');
  const nombre = tarjeta.querySelector('h3').textContent.trim();

  function voltear() {
    const vuelta = tarjeta.classList.toggle('volteada');
    boton.setAttribute('aria-pressed', String(vuelta));
    boton.setAttribute('aria-label', (vuelta ? 'Ver frente de ' : 'Ver detalle de ') + nombre);
    frente.setAttribute('aria-hidden', String(vuelta));
    dorso.setAttribute('aria-hidden', String(!vuelta));
  }

  boton.addEventListener('click', (evento) => {
    evento.stopPropagation();
    voltear();
  });
  tarjeta.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) return;
    voltear();
  });
});

// Carruseles: flechas, puntos, teclado y deslizamiento. Se detienen al pasar
// el ratón o al enfocar un control, y no avanzan si se pide menos movimiento.
document.querySelectorAll('[data-carrusel]').forEach((carrusel) => {
  const pista = carrusel.querySelector('.carrusel-pista');
  const diapositivas = Array.from(carrusel.querySelectorAll('.carrusel-diapositiva'));
  const puntosContenedor = carrusel.querySelector('.carrusel-puntos');
  const estado = carrusel.querySelector('[data-estado-carrusel]');
  if (!pista || diapositivas.length < 2) return;

  let actual = 0;
  const puntos = diapositivas.map((_, indice) => {
    const punto = document.createElement('button');
    punto.type = 'button';
    punto.setAttribute('aria-label', 'Ir a la diapositiva ' + (indice + 1));
    punto.addEventListener('click', () => ir(indice));
    puntosContenedor.appendChild(punto);
    return punto;
  });

  function ir(n) {
    actual = (n + diapositivas.length) % diapositivas.length;
    pista.style.transform = 'translateX(-' + (actual * 100) + '%)';
    diapositivas.forEach((diapositiva, i) => diapositiva.setAttribute('aria-hidden', String(i !== actual)));
    puntos.forEach((punto, i) => punto.setAttribute('aria-current', String(i === actual)));
    estado.textContent = 'Diapositiva ' + (actual + 1) + ' de ' + diapositivas.length;
  }

  carrusel.querySelector('[data-anterior]').addEventListener('click', () => ir(actual - 1));
  carrusel.querySelector('[data-siguiente]').addEventListener('click', () => ir(actual + 1));

  let temporizador = null;
  function detener() {
    if (temporizador) { clearInterval(temporizador); temporizador = null; }
  }
  function arrancar() {
    detener();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    temporizador = setInterval(() => { if (!document.hidden) ir(actual + 1); }, 7000);
  }
  carrusel.addEventListener('mouseenter', detener);
  carrusel.addEventListener('mouseleave', arrancar);
  carrusel.addEventListener('focusin', detener);
  carrusel.addEventListener('focusout', arrancar);
  carrusel.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowLeft') { evento.preventDefault(); ir(actual - 1); }
    if (evento.key === 'ArrowRight') { evento.preventDefault(); ir(actual + 1); }
  });
  let inicioX = null;
  carrusel.addEventListener('pointerdown', (evento) => { inicioX = evento.clientX; });
  carrusel.addEventListener('pointerup', (evento) => {
    if (inicioX === null) return;
    const diferencia = evento.clientX - inicioX;
    if (Math.abs(diferencia) > 45) ir(actual + (diferencia < 0 ? 1 : -1));
    inicioX = null;
  });

  ir(0);
  arrancar();
});
