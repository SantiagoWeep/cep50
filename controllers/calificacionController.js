// controllers/calificacionController.js
const db = require('../config/db');

exports.mostrarListaAlumnos = async (req, res) => {
  if (!req.profesor) return res.status(401).send('No autorizado');

  const profesorId = parseInt(req.profesor.id, 10);
  const nombreCompleto = `${req.profesor.nombre} ${req.profesor.apellido}`;
 
  const query = `
    SELECT 
      c.id AS curso_id,
      c.nombre AS curso_nombre,
      m.id AS materia_id,
      m.nombre AS materia_nombre,
      a.id AS alumno_id,
      a.nombre AS alumno_nombre,
      a.apellido AS alumno_apellido,
      n.trimestre,
      n.numero,
      n.nota
    FROM curso_profesor_materia cpm
    JOIN cursos c ON c.id = cpm.curso_id
    JOIN materias m ON m.id = cpm.materia_id
    JOIN alumnos a ON a.curso_id = c.id
    LEFT JOIN notas n ON n.alumno_id = a.id AND n.curso_id = c.id AND n.materia_id = m.id
    WHERE cpm.profesor_id = ?
    ORDER BY c.id, m.id, a.id, n.trimestre, n.numero
  `;

  try {
    const [results] = await db.query(query, [profesorId]);

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
              1: null,
              2: null,
              3: null,
              4: null
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

      // Exámenes especiales
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
        alumnos: Array.from(m.alumnos.values())
      }))
    }));
    

    res.render('calificaciones', {
      layout: false,
      nombreCompleto,
      cursos: cursosArray
    });
  } catch (err) {
    console.error('Error al obtener datos:', err);
    res.status(500).send('Error en base de datos');
  }
};



exports.guardarNotas = async (req, res) => {
  const data = req.body;
  const inserts = [];

  for (const key in data) {
    if (key.startsWith('nota_')) {
      const [, alumnoId, cursoId, materiaId, trimestre, numero] = key.split('_');
      const nota = parseFloat(data[key]);
        const notaTruncada = Math.round(nota * 100) / 100;


          if (
        !isNaN(nota) &&
        [1, 2, 3, 4].includes(parseInt(trimestre)) &&
        [1, 2, 3, 4].includes(parseInt(numero))
      ) {
        inserts.push([alumnoId, cursoId, materiaId, parseInt(trimestre), parseInt(numero), nota]);
      }

    }
  }

  if (inserts.length === 0) return res.redirect('/calificaciones');

  const values = inserts.map(([alumnoId, cursoId, materiaId, trimestre, numero, nota]) =>
    `(${alumnoId}, ${cursoId}, ${materiaId}, ${trimestre}, ${numero}, ${nota}, TRUE)`
  ).join(',');

  const queryNotas = `
    INSERT INTO notas (alumno_id, curso_id, materia_id, trimestre, numero, nota, guardado)
    VALUES ${values}
    ON DUPLICATE KEY UPDATE 
      nota = VALUES(nota), 
      guardado = TRUE;
  `;

  try {
    await db.query(queryNotas);

    // Ahora actualizamos los boletines para reflejar lo guardado
    const updateBoletinesQuery = `
      INSERT INTO boletines (
        alumno_id, curso_id, materia_id,
        trimestre_1, trimestre_2, trimestre_3,
        examen_dic, examen_mar, promedio_final
      )
      SELECT 
        alumno_id,
        curso_id,
        materia_id,
        TRUNCATE(AVG(CASE WHEN trimestre = 1 THEN nota END), 2) AS trimestre_1,
        TRUNCATE(AVG(CASE WHEN trimestre = 2 THEN nota END), 2) AS trimestre_2,
        TRUNCATE(AVG(CASE WHEN trimestre = 3 THEN nota END), 2) AS trimestre_3,
        MAX(CASE WHEN trimestre = 4 AND numero = 1 THEN nota END) AS examen_dic,
        MAX(CASE WHEN trimestre = 4 AND numero = 2 THEN nota END) AS examen_mar,
        
        TRUNCATE(
          CASE
            WHEN AVG(CASE WHEN trimestre IN (1, 2, 3) THEN nota END) >= 6 THEN 
              AVG(CASE WHEN trimestre IN (1, 2, 3) THEN nota END)
            WHEN MAX(CASE WHEN trimestre = 4 AND numero = 1 THEN nota END) >= 6 THEN 
              MAX(CASE WHEN trimestre = 4 AND numero = 1 THEN nota END)
            WHEN MAX(CASE WHEN trimestre = 4 AND numero = 2 THEN nota END) >= 6 THEN 
              MAX(CASE WHEN trimestre = 4 AND numero = 2 THEN nota END)
            ELSE AVG(CASE WHEN trimestre IN (1, 2, 3) THEN nota END)
          END
        , 2) AS promedio_final
      FROM notas
      GROUP BY alumno_id, curso_id, materia_id
      ON DUPLICATE KEY UPDATE 
        trimestre_1 = VALUES(trimestre_1),
        trimestre_2 = VALUES(trimestre_2),
        trimestre_3 = VALUES(trimestre_3),
        examen_dic = VALUES(examen_dic),
        examen_mar = VALUES(examen_mar),
        promedio_final = VALUES(promedio_final);
    `;

    await db.query(updateBoletinesQuery);

    res.redirect('/calificaciones');
  } catch (err) {
    console.error('Error al guardar o actualizar boletines:', err);
    res.status(500).send('Error al guardar notas o boletines');
  }
};
