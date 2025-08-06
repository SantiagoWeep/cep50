const db = require('./config/db');

async function test() {
  try {
    const [rows] = await db.query('SELECT NOW() AS ahora');
    console.log('Conexión OK:', rows);

    const [alumnos] = await db.query(`
      SELECT alumnos.*, cursos.nombre AS curso_nombre, cursos.orden 
      FROM alumnos 
      JOIN cursos ON alumnos.curso_id = cursos.id 
      ORDER BY cursos.orden, alumnos.apellido
    `);
    console.log('Alumnos:', alumnos.length);

  } catch (error) {
    console.error('Error en test:', error);
  }
}

test();
