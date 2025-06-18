 function eliminarAlumno(id) {
    if (confirm('¿Estás seguro de eliminar este alumno?')) {
      fetch(`/alumnos/eliminar/${id}`, {
        method: 'DELETE'
      })
      .then(res => res.ok ? location.reload() : alert('Error al eliminar'))
      .catch(err => alert('Error de conexión'));
    }
  }

  //-----------------------------------alumno regular?-------------------//

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.switch-regular').forEach(switchInput => {
      switchInput.addEventListener('change', async (e) => {
        const alumnoId = e.target.dataset.id;
        const nuevoEstado = e.target.checked ? 1 : 0;

        try {
          const response = await fetch(`/alumnos/${alumnoId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ regular: nuevoEstado })
          });

          if (response.ok) {
            const statusText = e.target.checked ? 'Sí' : 'No';
            const statusColor = e.target.checked ? 'green' : 'red';
            e.target.nextElementSibling.textContent = statusText;
            e.target.nextElementSibling.style.color = statusColor;
          } else {
            alert('Error al actualizar el estado');
            // revertir el estado en caso de error
            e.target.checked = !e.target.checked;
          }
        } catch (error) {
          console.error('Error:', error);
          e.target.checked = !e.target.checked;
          alert('Error al conectar con el servidor');
        }
      });
    });
  });


/*-------------------------------busqueda-boto---------------------------*/
  document.addEventListener('DOMContentLoaded', () => {
    const inputBuscar = document.getElementById('inputBuscarAlumno');
    let timer;

    inputBuscar.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const termino = inputBuscar.value.trim();
        buscarAlumnos(termino);
      }, 400);
    });

    async function buscarAlumnos(termino) {
      try {
        const response = await fetch(`/admin/buscar-alumnos?q=${encodeURIComponent(termino)}`);
        const html = await response.text();

        // Reemplazás el contenido actual de la tabla con los resultados filtrados
        document.querySelector('#contenedor-tabla-alumnos').innerHTML = html;

      } catch (error) {
        console.error('Error al buscar alumnos:', error);
      }
    }
  });

