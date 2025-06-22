document.addEventListener('DOMContentLoaded', () => {
  const verMasBtn = document.getElementById('ver-mas');
  const inputBusqueda = document.getElementById('input-busqueda');
  const contenedor = document.getElementById('boletines-container');

  // ---------------- Botón "Ver más" ----------------
  if (verMasBtn) {
    verMasBtn.addEventListener('click', async (event) => {
      const btn = event.target;
      const offset = parseInt(btn.getAttribute('data-offset'), 10);
      const q = inputBusqueda?.value.trim();

      let url = `/admin/boletines?offset=${offset}`;
      if (q) url += `&q=${encodeURIComponent(q)}`;

      btn.disabled = true;
      btn.textContent = 'Cargando...';

      try {
        const res = await fetch(url, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        const html = await res.text();
        contenedor.innerHTML = ''; 
        contenedor.insertAdjacentHTML('beforeend', html);

        if (!html.trim()) {
          btn.disabled = true;
          btn.innerText = 'No hay más boletines';
        } else {
          btn.setAttribute('data-offset', offset + 10);
          btn.disabled = false;
          btn.textContent = 'Ver más';
        }
      } catch (e) {
        console.error('Error al cargar más boletines:', e);
        btn.textContent = 'Error';
      }
    });
  }

  // ---------------- Buscador en tiempo real ----------------
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', async (event) => {
      const q = event.target.value.trim();

      contenedor.innerHTML = '';

      if (q === '') {
        // Restaurar lista original
        try {
          const res = await fetch('/admin/boletines?offset=0', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          });
          const html = await res.text();
          contenedor.innerHTML = html;

          if (verMasBtn) {
            verMasBtn.style.display = 'block';
            verMasBtn.disabled = false;
            verMasBtn.innerText = 'Ver más';
            verMasBtn.setAttribute('data-offset', '10');
          }
        } catch (e) {
          console.error('Error al recargar boletines:', e);
        }
        return;
      }

      // Buscar coincidencias
      try {
        const res = await fetch(`/admin/boletines/buscar?q=${encodeURIComponent(q)}`, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        const html = await res.text();
        contenedor.innerHTML = html;

        // Ocultamos el botón "Ver más" al hacer una búsqueda
        if (verMasBtn) verMasBtn.style.display = 'none';
      } catch (e) {
        console.error('Error al buscar boletines:', e);
      }
    });
  }
});


document.addEventListener('DOMContentLoaded', () => {
  const listaCursos = document.getElementById('lista-cursos');
  const inputBusqueda = document.getElementById('input-busqueda');
  const contenedor = document.getElementById('boletines-container');
  const verMasBtn = document.getElementById('ver-mas');

  if (listaCursos) {
    listaCursos.addEventListener('click', async (e) => {
      e.preventDefault();
      const curso = e.target.dataset.curso;

      contenedor.innerHTML = ''; // Limpiamos contenido actual
      if (verMasBtn) verMasBtn.style.display = 'none';

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
