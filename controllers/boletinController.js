// controllers/boletinController.js
const db = require('../config/db');

exports.mostrarBoletin = async (req, res) => {
  const alumnoId = req.alumno.id;

  try {
    // 1. Obtener datos del alumno
    const [alumnoResults] = await db.query('SELECT * FROM alumnos WHERE id = ?', [alumnoId]);
    if (alumnoResults.length === 0) return res.status(404).send('Alumno no encontrado');
    const alumno = alumnoResults[0];

    // 2. Obtener materias del curso
    const queryMaterias = `
      SELECT m.nombre AS materia, m.id AS materia_id
      FROM materias m
      JOIN curso_profesor_materia cpm ON cpm.materia_id = m.id
      WHERE cpm.curso_id = ?
    `;
    const [materiasResults] = await db.query(queryMaterias, [alumno.curso_id]);

    // 3. Obtener notas del alumno
    const queryNotas = `
      SELECT 
        n.materia_id,
        TRUNCATE(AVG(CASE WHEN n.trimestre = 1 THEN n.nota END), 2) AS trimestre_1,
        TRUNCATE(AVG(CASE WHEN n.trimestre = 2 THEN n.nota END), 2) AS trimestre_2,
        TRUNCATE(AVG(CASE WHEN n.trimestre = 3 THEN n.nota END), 2) AS trimestre_3,
        MAX(CASE WHEN n.trimestre = 4 AND n.numero = 1 THEN n.nota END) AS examen_dic,
        MAX(CASE WHEN n.trimestre = 4 AND n.numero = 2 THEN n.nota END) AS examen_mar
      FROM notas n
      WHERE n.alumno_id = ? AND n.curso_id = ?
      GROUP BY n.materia_id
    `;
    const [notasResults] = await db.query(queryNotas, [alumnoId, alumno.curso_id]);

    // Organizar las materias y notas
    const materias = {};
    notasResults.forEach(row => {
      materias[row.materia_id] = {
        nombre: '',  // Se llenará luego
        notas: {
          T1: row.trimestre_1 ?? '-',
          T2: row.trimestre_2 ?? '-',
          T3: row.trimestre_3 ?? '-',
          ExDic: row.examen_dic ?? '-',
          ExMar: row.examen_mar ?? '-'
        }
      };
    });

    // Asignar nombres de materias
    materiasResults.forEach(row => {
      if (materias[row.materia_id]) {
        materias[row.materia_id].nombre = row.materia;
      }
    });

    // Calcular promedio final por materia
    Object.values(materias).forEach(materia => {
      const trimestres = [materia.notas.T1, materia.notas.T2, materia.notas.T3]
        .map(n => (n !== '-' ? parseFloat(n) : NaN))
        .filter(n => !isNaN(n));

      let promedioTrimestres = null;
      if (trimestres.length > 0) {
        promedioTrimestres = trimestres.reduce((a, b) => a + b, 0) / trimestres.length;
      }

      const exDic = parseFloat(materia.notas.ExDic);
      const exMar = parseFloat(materia.notas.ExMar);

      let promedioFinal = promedioTrimestres;

      if (promedioTrimestres < 6) {
        if (!isNaN(exDic) && exDic >= 6) {
          promedioFinal = exDic;
        } else if (!isNaN(exMar) && exMar >= 6) {
          promedioFinal = exMar;
        }
      }

      materia.promedioFinal = promedioFinal !== null ? promedioFinal.toFixed(2) : '-';
    });

    const materiasArray = Object.values(materias);

    // Renderizar boletín
    res.render('boletin', {
      layout: false,
      alumno,
      materias: materiasArray
    });

  } catch (err) {
    console.error('Error al mostrar boletín:', err);
    res.status(500).send('Error interno del servidor');
  }
};
