document.addEventListener('DOMContentLoaded', () => {
  const inputBusqueda = document.getElementById('input-busqueda');
  const listaCursos = document.getElementById('lista-cursos');
  const contenedor = document.getElementById('boletines-container');

  // ---------------- Buscador en tiempo real ----------------
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', async (event) => {
      const q = event.target.value.trim();
      contenedor.innerHTML = '';

      try {
        let url = q === ''
          ? '/admin/boletines?ajax=1'   // 👈 pedimos solo el partial
          : `/admin/boletines/buscar?q=${encodeURIComponent(q)}&ajax=1`;

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

  // ---------------- Filtro por curso ----------------
  if (listaCursos) {
    listaCursos.addEventListener('click', async (e) => {
      e.preventDefault();

      const curso = e.target.dataset.curso;
      if (!curso) return;

      contenedor.innerHTML = ''; // Limpiamos contenido actual

      try {
        const res = await fetch(`/admin/boletines?curso=${encodeURIComponent(curso)}&ajax=1`, {
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

