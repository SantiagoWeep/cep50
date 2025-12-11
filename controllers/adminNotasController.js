const db = require('../config/db');

function truncar2Decimales(valor) {
  return Math.trunc(valor * 100) / 100;
}

function calcularPromedioFinal(alumno) {
  if (!alumno.notas || alumno.notas.length === 0) return null;

  const promediosTrimestrales = alumno.notas.map(tri => {
    const notasValidas = Object.values(tri.calificaciones)
      .map(n => parseFloat(n))
      .filter(n => !isNaN(n));
    if (notasValidas.length === 0) return null;
    const suma = notasValidas.reduce((a,b) => a + b, 0);
    return truncar2Decimales(suma / notasValidas.length);
  }).filter(x => x !== null);

  let promedioFinal = null;
  if (promediosTrimestrales.length) {
    const sumaProm = promediosTrimestrales.reduce((a,b) => a + b, 0);
    promedioFinal = truncar2Decimales(sumaProm / promediosTrimestrales.length);
  }

  const exDic = alumno.examen_dic !== null ? parseFloat(alumno.examen_dic) : null;
  const exMar = alumno.examen_mar !== null ? parseFloat(alumno.examen_mar) : null;

  if ((promedioFinal === null || promedioFinal < 6) && exDic !== null && exDic >= 6) {
    promedioFinal = exDic;
  } else if ((promedioFinal === null || promedioFinal < 6) && exMar !== null && exMar >= 6) {
    promedioFinal = exMar;
  }

  return promedioFinal;
}

exports.mostrarNotas = async (req, res) => {
  const cursoFiltro = req.query.curso || '';
  const cursosValidos = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto"];
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
      TRUNCATE(n.nota, 2) AS nota
    FROM curso_profesor_materia cpm
    JOIN cursos c ON c.id = cpm.curso_id
    JOIN materias m ON m.id = cpm.materia_id
    JOIN profesores p ON p.id = cpm.profesor_id
    JOIN alumnos a ON a.curso_id = c.id
    LEFT JOIN notas n ON n.alumno_id = a.id AND n.curso_id = c.id AND n.materia_id = m.id
  `;

  if (filtrarPorCurso) {
    query += ` WHERE c.nombre = ? `;
  }

  query += ` ORDER BY c.id, m.id, a.id, n.trimestre, n.numero `;

  try {
    const params = filtrarPorCurso ? [cursoFiltro] : [];
    const [results] = await db.query(query, params);

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
            calificaciones: {1: null, 2: null, 3: null, 4: null}
          })),
          examen_dic: null,
          examen_mar: null,
          promedio_final: null
        });
      }

      const alumno = materia.alumnos.get(row.alumno_id);

      if (row.trimestre >= 1 && row.trimestre <= 3 && row.numero >= 1 && row.numero <= 4) {
        const trimestre = alumno.notas.find(n => n.trimestre === row.trimestre);
        if (trimestre) {
          trimestre.calificaciones[row.numero] = row.nota !== null ? Number(row.nota) : null;
        }
      }

      if (row.trimestre === 4) {
        if (row.numero === 1) alumno.examen_dic = row.nota !== null ? Number(row.nota) : null;
        if (row.numero === 2) alumno.examen_mar = row.nota !== null ? Number(row.nota) : null;
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
    alumnos: Array.from(m.alumnos.values()).map(al => {
      // Promedio por trimestre (truncado)
      const promediosTrimestrales = al.notas.map(n => {
        const notasValidas = Object.values(n.calificaciones)
          .map(x => parseFloat(x))
          .filter(x => !isNaN(x));
        if (notasValidas.length === 0) return null;
        const suma = notasValidas.reduce((a,b)=>a+b,0);
        return Math.trunc((suma / notasValidas.length) * 100) / 100;
      }).filter(x => x !== null);

      // Promedio final
      let final = null;
      if (promediosTrimestrales.length) {
        const sumaProm = promediosTrimestrales.reduce((a,b)=>a+b,0);
        final = Math.trunc((sumaProm / promediosTrimestrales.length) * 100) / 100;
      }

      // Exámenes
      const exDic = al.examen_dic !== null ? parseFloat(al.examen_dic) : null;
      const exMar = al.examen_mar !== null ? parseFloat(al.examen_mar) : null;

      if ((final === null || final < 6) && exDic !== null && exDic >= 6) final = exDic;
      else if ((final === null || final < 6) && exMar !== null && exMar >= 6) final = exMar;

      // Guardar promedio final en el alumno
      al.promedio_final = calcularPromedioFinal(al);
      // Al final de mostrarNotas y buscarNotas, justo antes del return:

const cursosArray = Object.values(cursos).map(c => ({
  curso_id: c.curso_id || null,
  curso: c.curso,
  materias: Object.values(c.materias).map(m => ({
    materia_id: m.materia_id,
    materia_nombre: m.materia_nombre,
    profesor_nombre: m.profesor_nombre,
    profesor_apellido: m.profesor_apellido,
    alumnos: Array.from(m.alumnos.values())
      .map(al => {
        // Cálculo correcto de promedios trimestrales truncados
        const promediosTrimestrales = al.notas.map(tri => {
          const validas = Object.values(tri.calificaciones)
            .map(n => parseFloat(n))
            .filter(n => !isNaN(n));
          if (validas.length === 0) return null;
          const prom = validas.reduce((a,b) => a + b, 0) / validas.length;
          return Math.trunc(prom * 100) / 100; // ← truncado a 2 decimales
        }).filter(p => p !== null);

        let final = null;
        if (promediosTrimestrales.length > 0) {
          const suma = promediosTrimestrales.reduce((a,b) => a + b, 0);
          final = Math.trunc((suma / promediosTrimestrales.length) * 100) / 100;
        }

        const exDic = al.examen_dic !== null ? parseFloat(al.examen_dic) : null;
        const exMar = al.examen_mar !== null ? parseFloat(al.examen_mar) : null;

        if ((final === null || final < 6) && exDic !== null && exDic >= 6) final = exDic;
        else if ((final === null || final < 6) && exMar !== null && exMar >= 6) final = exMar;

        return {
          ...al,
          promedio_final: final // ← ya calculado correctamente
        };
      })
      // ORDENAR POR APELLIDO + NOMBRE
      .sort((a, b) => {
        const apA = a.apellido.toLowerCase();
        const apB = b.apellido.toLowerCase();
        if (apA !== apB) return apA.localeCompare(apB);
        return a.nombre.toLowerCase().localeCompare(b.nombre.toLowerCase());
      })
  }))
}));

      return al; // <--- Muy importante retornar el objeto
    })
  }))
}));

    res.render('admin/notas', {
      tipoBusqueda: 'materia o nombre',
      idInputBusqueda: 'input-busqueda',
      textoBotonAgregar: '',
      idModalAgregar: '',
      mostrarFiltroCurso: true,
      cursoSeleccionado: cursoFiltro,
      cursos: cursosArray,
      search: req.query.q || '',
      offset: 0
    });

  } catch (err) {
    console.error('Error al obtener notas para admin:', err);
    res.status(500).send('Error de base de datos');
  }
};

exports.buscarNotas = async (req, res) => {
  const q = req.query.q?.trim() || '';

  if (!q) {
    return res.render('parciales/NotasList', { cursos: [], layout: false });
  }

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
        TRUNCATE(n.nota, 2) AS nota
      FROM curso_profesor_materia cpm
      JOIN cursos c ON c.id = cpm.curso_id
      JOIN materias m ON m.id = cpm.materia_id
      JOIN profesores p ON p.id = cpm.profesor_id
      JOIN alumnos a ON a.curso_id = c.id
      LEFT JOIN notas n ON n.alumno_id = a.id AND n.curso_id = c.id AND n.materia_id = m.id
      WHERE 
        CONCAT(a.apellido, ' ', a.nombre) LIKE ? OR
        CONCAT(a.nombre, ' ', a.apellido) LIKE ? OR
        m.nombre LIKE ? OR 
        p.nombre LIKE ? OR 
        p.apellido LIKE ?
      ORDER BY c.id, m.id, a.apellido, a.nombre, n.trimestre, n.numero
    `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);

    const cursos = {};

    results.forEach(row => {
      if (!cursos[row.curso_id]) {
        cursos[row.curso_id] = { curso_id: row.curso_id, curso: row.curso, materias: {} };
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
            calificaciones: {1: null, 2: null, 3: null, 4: null}
          })),
          examen_dic: null,
          examen_mar: null
        });
      }

      const alumno = materia.alumnos.get(row.alumno_id);

      if (row.trimestre >= 1 && row.trimestre <= 3 && row.numero >= 1 && row.numero <= 4) {
        alumno.notas[row.trimestre - 1].calificaciones[row.numero] = row.nota !== null ? Number(row.nota) : null;
      }
      if (row.trimestre === 4) {
        if (row.numero === 1) alumno.examen_dic = row.nota;
        if (row.numero === 2) alumno.examen_mar = row.nota;
      }
    });

    // === CÁLCULO CORRECTO + ORDEN ALFABÉTICO ===
    const cursosArray = Object.values(cursos).map(c => ({
      curso: c.curso,
      materias: Object.values(c.materias).map(m => ({
        materia_nombre: m.materia_nombre,
        profesor_nombre: m.profesor_nombre,
        profesor_apellido: m.profesor_apellido,
        alumnos: Array.from(m.alumnos.values())
          .map(al => {
            // Promedios trimestrales truncados
            const promsTrim = al.notas.map(tri => {
              const vals = Object.values(tri.calificaciones).filter(n => n !== null);
              if (vals.length === 0) return null;
              const prom = vals.reduce((a,b) => a + b, 0) / vals.length;
              return Math.trunc(prom * 100) / 100;
            }).filter(x => x !== null);

            let final = promsTrim.length
              ? Math.trunc((promsTrim.reduce((a,b)=>a+b,0) / promsTrim.length) * 100) / 100
              : null;

            const exDic = al.examen_dic;
            const exMar = al.examen_mar;

            if ((final === null || final < 6) && exDic >= 6) final = exDic;
            else if ((final === null || final < 6) && exMar >= 6) final = exMar;

            return { ...al, promedio_final: final };
          })
          // ORDENAR POR APELLIDO + NOMBRE
          .sort((a, b) => {
            const apA = a.apellido.toLowerCase();
            const apB = b.apellido.toLowerCase();
            if (apA !== apB) return apA.localeCompare(apB);
            return a.nombre.toLowerCase().localeCompare(b.nombre.toLowerCase());
          })
      }))
    }));

    res.render('parciales/NotasList', { 
        cursos: cursosArray, 
        search: q,           // ← ¡AQUÍ ESTABA EL PROBLEMA!
        layout: false 
      });

  } catch (err) {
    console.error('Error en búsqueda:', err);
    res.status(500).send('Error');
  }
};

exports.imprimirNotas = async (req, res) => {
  const { cursoId, materiaId } = req.params;

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
        TRUNCATE(n.nota, 2) AS nota
      FROM curso_profesor_materia cpm
      JOIN cursos c ON c.id = cpm.curso_id
      JOIN materias m ON m.id = cpm.materia_id
      JOIN profesores p ON p.id = cpm.profesor_id
      JOIN alumnos a ON a.curso_id = c.id
      LEFT JOIN notas n ON n.alumno_id = a.id AND n.curso_id = c.id AND n.materia_id = m.id
      WHERE c.id = ? AND m.id = ?
      ORDER BY a.apellido ASC, a.nombre ASC, n.trimestre, n.numero
    `, [cursoId, materiaId]);

    const alumnosMap = new Map();
    let materiaInfo = null;

    results.forEach(row => {
      if (!materiaInfo) {
        materiaInfo = {
          curso: row.curso,
          materia: row.materia_nombre,
          profesor: row.profesor_nombre + " " + row.profesor_apellido
        };
      }

      if (!alumnosMap.has(row.alumno_id)) {
      alumnosMap.set(row.alumno_id, {
        nombre: row.alumno_nombre,      // ← CORREGIDO
        apellido: row.alumno_apellido,  // ← CORREGIDO
        notas: [1,2,3].map(tri => ({
          trimestre: tri,
          calificaciones: {1:null,2:null,3:null,4:null}
        })),
        examen_dic: null,
        examen_mar: null
      });
    }


      const alumno = alumnosMap.get(row.alumno_id);
      // Dentro de imprimirNotas, después de llenar alumnosMap:

const alumnosOrdenados = Array.from(alumnosMap.values())
  .sort((a, b) => {
    const apA = (a.apellido || '').toLowerCase();
    const apB = (b.apellido || '').toLowerCase();
    if (apA !== apB) return apA.localeCompare(apB);
    return (a.nombre || '').toLowerCase().localeCompare(b.nombre || '');
  });

// Calculamos promedios correctos (truncados)
alumnosOrdenados.forEach(al => {
  const promediosTrim = al.notas.map(tri => {
    const nums = Object.values(tri.calificaciones)
      .map(n => parseFloat(n))
      .filter(n => !isNaN(n));
    if (nums.length === 0) return null;
    return Math.trunc((nums.reduce((a,b)=>a+b,0) / nums.length) * 100) / 100;
  }).filter(x => x !== null);

  let final = promediosTrim.length 
    ? Math.trunc((promediosTrim.reduce((a,b)=>a+b,0) / promediosTrim.length) * 100) / 100 
    : null;

  const exDic = al.examen_dic !== null ? parseFloat(al.examen_dic) : null;
  null;
  const exMar = al.examen_mar !== null ? parseFloat(al.examen_mar) : null;

  if ((final === null || final < 6) && exDic >= 6) final = exDic;
  else if ((final === null || final < 6) && exMar >= 6) final = exMar;

  al.promedio_final = final;
});

res.render('admin/notas_imprimir', {
  materia: materiaInfo,
  alumnos: alumnosOrdenados, // ← ya ordenados y con promedio correcto
  layout: false
});

      if (row.trimestre >= 1 && row.trimestre <= 3) {
        alumno.notas[row.trimestre - 1].calificaciones[row.numero] = row.nota;
      }

      if (row.trimestre === 4) {
        if (row.numero === 1) alumno.examen_dic = row.nota;
        if (row.numero === 2) alumno.examen_mar = row.nota;
      }
    });

    res.render('admin/notas_imprimir', {
      materia: materiaInfo,
      alumnos: Array.from(alumnosMap.values()),
      layout: false
    });

  } catch (error) {
    console.error("Error al generar impresión:", error);
    res.status(500).send("Error al generar impresión");
  }
};
