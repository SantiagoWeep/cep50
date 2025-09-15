
const db = require('../config/db');

function truncar2Decimales(valor) {
  return Math.trunc(valor * 100) / 100;
}
function calcularPromedioFinalBoletin(b) {
  const notas = [
    b.trimestre_1 !== null ? parseFloat(b.trimestre_1) : null,
    b.trimestre_2 !== null ? parseFloat(b.trimestre_2) : null,
    b.trimestre_3 !== null ? parseFloat(b.trimestre_3) : null,
  ].filter(n => n !== null);

  let promedio = null;
  if (notas.length) {
    promedio = truncar2Decimales(notas.reduce((a,b)=>a+b,0)/notas.length);
  }

  const exDic = b.examen_dic !== null ? parseFloat(b.examen_dic) : null;
  const exMar = b.examen_mar !== null ? parseFloat(b.examen_mar) : null;

  if ((promedio === null || promedio < 6) && exDic !== null && exDic >= 6) promedio = exDic;
  else if ((promedio === null || promedio < 6) && exMar !== null && exMar >= 6) promedio = exMar;

  return promedio;
}



exports.mostrarBoletines = async (req, res) => {
  const offset = parseInt(req.query.offset || 0);
  const limit = 30;
  const curso = req.query.curso || '';

  try {
    let query = `
      SELECT 
        a.nombre AS alumno_nombre,
        a.apellido AS alumno_apellido,
        c.nombre AS curso_nombre,
        m.nombre AS materia_nombre,
        b.trimestre_1, b.trimestre_2, b.trimestre_3,
        b.examen_dic, b.examen_mar, b.promedio_final
      FROM boletines b
      JOIN alumnos a ON b.alumno_id = a.id
      JOIN cursos c ON b.curso_id = c.id
      JOIN materias m ON b.materia_id = m.id
    `;

    const params = [];

    if (curso) {
      query += ` WHERE c.nombre = ? `;
      params.push(curso);
    }

    query += ` ORDER BY c.orden, a.apellido, a.nombre, m.nombre LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [boletines] = await db.query(query, params);

    const boletinesConPromedio = boletines.map(b => ({
      ...b,
      promedio_final: calcularPromedioFinalBoletin(b)
    }));


    if (req.xhr) {
      return res.render('parciales/boletinesList', { boletines: boletinesConPromedio, layout: false });
    }

    res.render('admin/boletines', {
      tipoBusqueda: 'DNI o Nombre',
      idInputBusqueda: 'input-busqueda',
      textoBotonAgregar: '',
      idModalAgregar: '',
      mostrarFiltroCurso: true,
      boletines: boletinesConPromedio,
      offset,
      search: req.query.q || '',
      cursoSeleccionado: curso
    });

  } catch (error) {
    console.error('Error al cargar boletines:', error);
    res.status(500).send('Error al cargar boletines');
  }
};




// controllers/adminBoletinController.js

exports.buscarBoletines = async (req, res) => {
  const q = req.query.q || '';

  try {
    const [boletines] = await db.query(`
      SELECT 
        a.nombre AS alumno_nombre,
        a.apellido AS alumno_apellido,
        a.dni AS alumno_dni,
        c.nombre AS curso_nombre,
        m.nombre AS materia_nombre,
        b.trimestre_1, b.trimestre_2, b.trimestre_3,
        b.examen_dic, b.examen_mar, b.promedio_final
      FROM boletines b
      JOIN alumnos a ON b.alumno_id = a.id
      JOIN cursos c ON b.curso_id = c.id
      JOIN materias m ON b.materia_id = m.id
      WHERE a.nombre LIKE ? OR a.apellido LIKE ? OR a.dni LIKE ? OR c.nombre LIKE ?
      ORDER BY a.apellido, a.nombre, c.nombre, m.nombre
      LIMIT 50
    `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);

    res.render('parciales/boletinesList', { boletines, layout: false });

  } catch (error) {
    console.error('Error buscando boletines:', error);
    res.status(500).send('Error buscando boletines');
  }
};
