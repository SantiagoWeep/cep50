function eliminarAlumno(id, nombreCompleto) {
  Swal.fire({
    title: '¿Estás seguro?',
    html: `Vas a eliminar al alumno <strong>${nombreCompleto}</strong> y todos sus registros.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/alumnos/eliminar/${id}`, {
        method: 'DELETE'
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: data.message,
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            // Recarga sin parámetros para evitar alerta doble
            window.location.href = window.location.pathname;
          });
        } else {
          Swal.fire('Error', data.message || 'No se pudo eliminar al alumno.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
      });
    }
  });
}



document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const success = params.get('success');
  const error = params.get('error');

  if (success) {
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: success,
      timer: 2500,
      showConfirmButton: false
    });
  }

  if (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error
    });
  }
});



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

