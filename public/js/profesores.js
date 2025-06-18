
  //-----------------------profe activo?----------------------------//
document.querySelectorAll('.switch-activo').forEach(switchInput => {
  switchInput.addEventListener('change', async () => {
    const id = switchInput.dataset.id;
    const activo = switchInput.checked ? 1 : 0;

    // Referencia al <span> que muestra "Sí"/"No"
    const spanEstado = switchInput.closest('.form-switch').querySelector('span');

    try {
      const response = await fetch(`/profesores/${id}/activo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activo })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      // ✅ Actualizar visualmente el texto y el color
      spanEstado.textContent = activo ? 'Sí' : 'No';
      spanEstado.style.color = activo ? 'green' : 'red';

    } catch (error) {
      alert('Error al cambiar estado del profesor');

      // ❌ Revertir el switch
      switchInput.checked = !switchInput.checked;

      // 🔁 Restaurar texto original
      const revertidoActivo = switchInput.checked ? 1 : 0;
      spanEstado.textContent = revertidoActivo ? 'Sí' : 'No';
      spanEstado.style.color = revertidoActivo ? 'green' : 'red';
    }
  });
});


//-----------------------------------agregar profe---------------------------------------


document.getElementById('formAgregarProfesor').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const data = {
      nombre: form.nombre.value,
      apellido: form.apellido.value,
      dni: form.dni.value,
      curso_id: form.curso_id.value,
      materia_id: form.materia_id.value,
      activo: form.activo.checked
    };

    try {
      const res = await fetch('/admin/profesores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        location.reload();
      } else {
        alert('Error al agregar profesor');
      }
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  });

//-----------------------------------buscar profesores--------------------------//

document.addEventListener('DOMContentLoaded', () => {
    const inputBuscar = document.getElementById('inputBuscarProfesor');
    if (!inputBuscar) return;

    let timer;

    inputBuscar.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const termino = inputBuscar.value.trim();
        buscarProfesores(termino);
      }, 400);
    });

    async function buscarProfesores(termino) {
      try {
        const response = await fetch(`admin/profesores?q=${encodeURIComponent(termino)}`);
        const html = await response.text();
        document.querySelector('#contenedor-tabla-profesores').innerHTML = html;
      } catch (error) {
        console.error('Error al buscar profesores:', error);
      }
    }
  });



  //---------------------------------editar profesores --------------------//
const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');

  if (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error al editar',
      text: error,
    });
  }
  

  //------------------------eliminar profesor------------------------//


  document.querySelectorAll('.btn-eliminar-profesor').forEach(btn => {
  btn.addEventListener('click', async () => {
    const id = btn.dataset.id;
    const nombre = btn.dataset.nombre;
    const apellido = btn.dataset.apellido;

    const confirmacion = await Swal.fire({
      title: `¿Eliminar a ${nombre} ${apellido}?`,
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        const res = await fetch(`/profesores/${id}`, { method: 'DELETE' });

        if (!res.ok) throw new Error();

        await Swal.fire('¡Eliminado!', 'El profesor fue eliminado.', 'success');
        location.reload();
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el profesor.', 'error');
      }
    }
  });
});
