document.addEventListener('DOMContentLoaded', () => {
  const inputBusqueda = document.getElementById('input-busqueda');
  const contenedor = document.getElementById('boletines-container');

  // ---------------- Buscador en tiempo real ----------------
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', async (event) => {
      const q = event.target.value.trim();
      contenedor.innerHTML = '';

      try {
        let url = q === ''
          ? '/admin/boletines?offset=0'
          : `/admin/boletines/buscar?q=${encodeURIComponent(q)}`;

        const res = await fetch(url, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const html = await res.text();
        contenedor.innerHTML = html;
      } catch (e) {
        console.error('Error al buscar boletines:', e);
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const listaCursos = document.getElementById('lista-cursos');
  const contenedor = document.getElementById('boletines-container');

  if (listaCursos) {
    listaCursos.addEventListener('click', async (e) => {
      e.preventDefault();
      const curso = e.target.dataset.curso;

      contenedor.innerHTML = ''; // Limpiamos contenido actual

      try {
        const res = await fetch(`/admin/boletines?curso=${encodeURIComponent(curso || '')}`, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const html = await res.text();
        contenedor.innerHTML = html;
      } catch (error) {
        console.error('Error al filtrar boletines por curso:', error);
      }
    });
  }
});
