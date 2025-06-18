const db = require('../config/db');

exports.mostrarNotas = async (req, res) => {
  const cursoFiltro = req.query.curso || '';  // Recibe curso desde query string

  // Cursos válidos para filtrar (igual a los que usás en la vista)
  const cursosValidos = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto"];

  // Si cursoFiltro no está en la lista o es vacío, no filtramos (traemos todos)
  const filtrarPorCurso = cursosValidos.includes(cursoFiltro);

  let query = `
  SELECT 
    c.id AS curso_id,
    c.nombre AS curso_nombre,
    m.id AS materia_id,
    m.nombre AS materia_nombre,
    p.nombre AS profesor_nombre,
    p.apellido AS profesor_apellido,
    a.id AS alumno_id,
    a.nombre AS alumno_nombre,
    a.apellido AS alumno_apellido,
    n.trimestre,
    n.numero,
    n.nota
  FROM curso_profesor_materia cpm
  JOIN cursos c ON c.id = cpm.curso_id
  JOIN materias m ON m.id = cpm.materia_id
  JOIN profesores p ON p.id = cpm.profesor_id
  JOIN alumnos a ON a.curso_id = c.id
  LEFT JOIN notas n ON n.alumno_id = a.id AND n.curso_id = c.id AND n.materia_id = m.id
`;


  // Agregamos filtro por curso si corresponde
  if (filtrarPorCurso) {
    query += ` WHERE c.nombre = ? `;
  }

  query += ` ORDER BY c.id, m.id, a.id, n.trimestre, n.numero `;

  try {
    const params = filtrarPorCurso ? [cursoFiltro] : [];
    const [results] = await db.query(query, params);

    // Proceso para agrupar datos (igual que antes)
    const cursos = {};

    results.forEach(row => {
      if (!cursos[row.curso_id]) {
        cursos[row.curso_id] = {
          curso_id: row.curso_id,
          curso: row.curso_nombre,
          materias: {}
        };
      }

      const curso = cursos[row.curso_id];

      if (!curso.materias[row.materia_id]) {
        curso.materias[row.materia_id] = {
          materia_id: row.materia_id,
          materia_nombre: row.materia_nombre,
          profesor_nombre: row.profesor_nombre,
          profesor_apellido: row.profesor_apellido,
          alumnos: new Map()
        };
      }

      const materia = curso.materias[row.materia_id];

      if (!materia.alumnos.has(row.alumno_id)) {
        materia.alumnos.set(row.alumno_id, {
          id: row.alumno_id,
          nombre: row.alumno_nombre,
          apellido: row.alumno_apellido,
          notas: [1, 2, 3].map(tri => ({
            trimestre: tri,
            calificaciones: {
              1: null, 2: null, 3: null, 4: null
            }
          }))
        });
      }

      const alumno = materia.alumnos.get(row.alumno_id);

      if (row.trimestre >= 1 && row.trimestre <= 3 && row.numero >= 1 && row.numero <= 4) {
        const trimestre = alumno.notas.find(n => n.trimestre === row.trimestre);
        if (trimestre) {
          trimestre.calificaciones[row.numero] = row.nota;
        }
      }

      if (row.trimestre === 4) {
        if (row.numero === 1) alumno.examen_dic = row.nota;
        if (row.numero === 2) alumno.examen_mar = row.nota;
      }
    });

    const cursosArray = Object.values(cursos).map(c => ({
  curso_id: c.curso_id,
  curso: c.curso,
  materias: Object.values(c.materias).map(m => ({
    materia_id: m.materia_id,
    materia_nombre: m.materia_nombre,
    profesor_nombre: m.profesor_nombre,
    profesor_apellido: m.profesor_apellido,
    alumnos: Array.from(m.alumnos.values())
  }))
}));


    res.render('admin/notas', {
  tipoBusqueda: 'materia o nombre',
  idInputBusqueda: 'input-busqueda',
  textoBotonAgregar: '',
  idModalAgregar: '',
  mostrarFiltroCurso: true, // Asegúrate de definir esta variable
  cursoSeleccionado: cursoFiltro,
  cursos: cursosArray,
  search: req.query.q || '',
  offset: 0,
});


  } catch (err) {
    console.error('Error al obtener notas para admin:', err);
    res.status(500).send('Error de base de datos');
  }
};

exports.buscarNotas = async (req, res) => {
  const q = req.query.q || '';

  try {
    const [results] = await db.query(`
      SELECT 
        c.id AS curso_id,
        c.nombre AS curso,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        p.nombre AS profesor_nombre,
        p.apellido AS profesor_apellido,
        a.id AS alumno_id,
        a.nombre AS alumno_nombre,
        a.apellido AS alumno_apellido,
        n.trimestre,
        n.numero,
        n.nota
      FROM curso_profesor_materia cpm
      JOIN cursos c ON c.id = cpm.curso_id
      JOIN materias m ON m.id = cpm.materia_id
      JOIN profesores p ON p.id = cpm.profesor_id
      JOIN alumnos a ON a.curso_id = c.id
      LEFT JOIN notas n ON n.alumno_id = a.id AND n.curso_id = c.id AND n.materia_id = m.id
      WHERE 
        m.nombre LIKE ? OR 
        p.nombre LIKE ? OR 
        p.apellido LIKE ?
      ORDER BY c.id, m.id, a.id, n.trimestre, n.numero
    `, [`%${q}%`, `%${q}%`, `%${q}%`]);

    const cursos = {};

    results.forEach(row => {
      if (!cursos[row.curso_id]) {
        cursos[row.curso_id] = {
          curso_id: row.curso_id,
          curso: row.curso,
          materias: {}
        };
      }

      const curso = cursos[row.curso_id];

      if (!curso.materias[row.materia_id]) {
        curso.materias[row.materia_id] = {
          materia_id: row.materia_id,
          materia_nombre: row.materia_nombre,
          profesor_nombre: row.profesor_nombre,
          profesor_apellido: row.profesor_apellido,
          alumnos: new Map()
        };
      }

      const materia = curso.materias[row.materia_id];

      if (!materia.alumnos.has(row.alumno_id)) {
        materia.alumnos.set(row.alumno_id, {
          id: row.alumno_id,
          nombre: row.alumno_nombre,
          apellido: row.alumno_apellido,
          notas: [1, 2, 3].map(tri => ({
            trimestre: tri,
            calificaciones: { 1: null, 2: null, 3: null, 4: null }
          }))
        });
      }

      const alumno = materia.alumnos.get(row.alumno_id);

      if (row.trimestre >= 1 && row.trimestre <= 3 && row.numero >= 1 && row.numero <= 4) {
        const trimestre = alumno.notas.find(n => n.trimestre === row.trimestre);
        if (trimestre) {
          trimestre.calificaciones[row.numero] = row.nota;
        }
      }

      if (row.trimestre === 4) {
        if (row.numero === 1) alumno.examen_dic = row.nota;
        if (row.numero === 2) alumno.examen_mar = row.nota;
      }
    });

    const cursosArray = Object.values(cursos).map(c => ({
      curso: c.curso,
      materias: Object.values(c.materias).map(m => ({
        materia_nombre: m.materia_nombre,
        profesor_nombre: m.profesor_nombre,
        profesor_apellido: m.profesor_apellido,
        alumnos: Array.from(m.alumnos.values())
      }))
    }));

    res.render('parciales/NotasList', { cursos: cursosArray, layout: false });

  } catch (err) {
    console.error('Error en búsqueda de notas:', err);
    res.status(500).send('Error en búsqueda');
  }
};
