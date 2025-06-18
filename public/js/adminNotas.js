  document.querySelectorAll('#lista-cursos a').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const curso = e.target.getAttribute('data-curso');
      const params = new URLSearchParams(window.location.search);
      if (curso) {
        params.set('curso', curso);
      } else {
        params.delete('curso');
      }
      window.location.search = params.toString();
    });
  });

//--------------buscador-------------------------//
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('input-busqueda');
  const contenedor = document.getElementById('contenedorNotas');

  if (input && contenedor) {
    input.addEventListener('input', async function () {
      const q = this.value.trim();
      if (q === '') return;

      try {
        const res = await fetch(`/admin/buscar-notas?q=${encodeURIComponent(q)}`);
        const html = await res.text();
        contenedor.innerHTML = html;
      } catch (err) {
        console.error('Error al buscar notas:', err);
      }
    });
  } else {
    console.warn('No se encontró el input o el contenedor.');
  }
});
