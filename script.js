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
