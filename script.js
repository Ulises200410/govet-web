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
    const elegido = servicios.find((s) => s.codigo === valor);
    decir('Anotado: ' + elegido.nombre + ' (' + elegido.precio + ').');
    pedirTexto('fecha', 'date');
    return;
  }
  if (valor === 'confirmar') { enviarCita(); return; }
  if (valor === 'rehacer') {
    borrador = {};
    decir('Vamos de nuevo.');
    paso = 'inicio';
    saludar();
    return;
  }
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
    decir('¿A qué hora?');
    ofrecer(horasDisponibles().map((h) => ({ etiqueta: h, valor: h })));
  } else if (paso === 'tutor') {
    borrador.tutor = texto;
    pedirTexto('mascota', 'text');
  } else if (paso === 'mascota') {
    borrador.mascota = texto;
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
    pedirTexto('tutor', 'text');
    return;
  }
  elegirOriginal(valor);
};

function puedeHablarConEscritorio() {
  return location.protocol === 'file:'
    || location.protocol === 'oc-preview:'
    || location.hostname === 'localhost'
    || location.hostname === '127.0.0.1';
}

async function enviarCita() {
  if (!puedeHablarConEscritorio()) {
    decir('Para agendar solo, abre esta página en tu computadora con el sistema GOVET encendido. Mientras tanto llámanos al 755 123 4567.');
    ofrecer([{ etiqueta: 'Ver servicios', valor: 'servicios' }]);
    return;
  }
  decir('Mandando la cita a la agenda...');
  const cuerpo = new URLSearchParams({
    tutor: borrador.tutor,
    mascota: borrador.mascota,
    servicio: borrador.servicio,
    fecha: borrador.fecha,
    hora: borrador.hora
  });
  try {
    const respuesta = await fetch('http://127.0.0.1:8085/api/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: cuerpo.toString()
    });
    const resultado = await respuesta.json();
    decir(resultado.mensaje);
    if (resultado.ok) decir('El folio ya quedó registrado en el sistema de la clínica.');
    ofrecer([{ etiqueta: 'Agendar otra cita', valor: 'rehacer' }, { etiqueta: 'Volver al inicio', valor: 'inicio' }]);
  } catch (error) {
    decir('No encontré el sistema GOVET encendido. Enciéndelo y vuelve a intentarlo, o llama al 755 123 4567.');
    ofrecer([{ etiqueta: 'Reintentar', valor: 'confirmar' }]);
  }
}

function abrirChat() {
  chatPanel.hidden = false;
  chatAbrir.setAttribute('aria-expanded', 'true');
  chatAbrir.setAttribute('aria-label', 'Cerrar asistente GOVET');
  if (!chatMensajes.childElementCount) saludar();
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
