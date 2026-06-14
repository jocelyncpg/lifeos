type Transaccion = {
  tipo: 'ingreso' | 'gasto'
  categoria: string
  monto: number
  fecha: string
}

type Nota = {
  nota: number
  fecha: string
}

type Entrenamiento = {
  deporte: string
  duracion: number
  fecha: string
  intensidad: string
}

type Evento = {
  titulo: string
  fecha: string
  hora: string | null
  tipo: string
  completado: boolean
}

type Medicamento = {
  nombre: string
  horarios: string
  activo: boolean
}

type CitaMedica = {
  especialidad: string
  fecha: string
  hora: string | null
  completada: boolean
}

export type Insight = {
  emoji: string
  tipo: 'positivo' | 'alerta' | 'info'
  mensaje: string
}

function diasDesde(fecha: string) {
  const hoy = new Date()
  const f = new Date(fecha)
  return Math.floor((hoy.getTime() - f.getTime()) / (1000 * 60 * 60 * 24))
}

function esEstaSemana(fecha: string) {
  return diasDesde(fecha) <= 7
}

function esSemanaPasada(fecha: string) {
  const dias = diasDesde(fecha)
  return dias > 7 && dias <= 14
}

function fechaHoyLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fechaMananaLocal() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function generarInsights(
  transacciones: Transaccion[],
  notas: Nota[],
  entrenamientos: Entrenamiento[],
  eventos: Evento[] = [],
  medicamentos: Medicamento[] = [],
  citas: CitaMedica[] = []
): Insight[] {
  const insights: Insight[] = []

  // --- Salud: medicamentos activos ---
  const medsActivos = medicamentos.filter(m => m.activo)
  if (medsActivos.length > 0) {
    insights.push({
      emoji: '💊',
      tipo: 'info',
      mensaje: `Recuerda tomar tus medicamentos: ${medsActivos.map(m => m.nombre).join(', ')}.`,
    })
  }

  // --- Salud: citas médicas próximas (3 días) ---
  const citasProximas = citas.filter(c => {
    if (c.completada) return false
    const dias = diasDesde(c.fecha)
    return dias <= 0 && dias >= -3
  })
  if (citasProximas.length > 0) {
    insights.push({
      emoji: '🏥',
      tipo: 'alerta',
      mensaje: `Tienes cita médica próxima: ${citasProximas.map(c => `${c.especialidad} (${c.fecha})`).join(', ')}.`,
    })
  }

  // --- Calendario: hoy y mañana ---
  const hoyStr = fechaHoyLocal()
  const mananaStr = fechaMananaLocal()

  const eventosHoy = eventos.filter(e => e.fecha === hoyStr && !e.completado)
  const eventosManana = eventos.filter(e => e.fecha === mananaStr && !e.completado)

  if (eventosHoy.length > 0) {
    insights.push({
      emoji: '📌',
      tipo: 'info',
      mensaje: `Hoy tienes ${eventosHoy.length} evento(s): ${eventosHoy.map(e => e.titulo).join(', ')}.`,
    })
  }

  if (eventosManana.length > 0) {
    insights.push({
      emoji: '⏰',
      tipo: 'info',
      mensaje: `Mañana tienes pendiente: ${eventosManana.map(e => e.titulo).join(', ')}.`,
    })
  }

  const eventosProximos7 = eventos.filter(e => {
    if (e.completado) return false
    const dias = diasDesde(e.fecha)
    return dias < 0 && dias >= -7
  })

  if (eventosProximos7.length >= 3) {
    insights.push({
      emoji: '🗓️',
      tipo: 'alerta',
      mensaje: `Tienes ${eventosProximos7.length} eventos pendientes en los próximos 7 días. Revisa tu calendario para organizarte.`,
    })
  }

  // --- Entrenamientos esta semana vs semana pasada ---
  const entrenosEstaSemana = entrenamientos.filter(e => esEstaSemana(e.fecha))
  const entrenosSemanaPasada = entrenamientos.filter(e => esSemanaPasada(e.fecha))

  if (entrenosEstaSemana.length === 0 && entrenosSemanaPasada.length > 0) {
    insights.push({
      emoji: '⚠️',
      tipo: 'alerta',
      mensaje: `No has registrado entrenamientos esta semana, pero la semana pasada tuviste ${entrenosSemanaPasada.length}. ¡No pierdas el ritmo!`,
    })
  } else if (entrenosEstaSemana.length > entrenosSemanaPasada.length && entrenosSemanaPasada.length > 0) {
    insights.push({
      emoji: '🔥',
      tipo: 'positivo',
      mensaje: `¡Vas con más actividad que la semana pasada! ${entrenosEstaSemana.length} entrenamientos esta semana.`,
    })
  }

  // --- Gastos en delivery/entretenimiento vs ejercicio ---
  const gastosEstaSemana = transacciones.filter(t => t.tipo === 'gasto' && esEstaSemana(t.fecha))
  const gastosEntretenimiento = gastosEstaSemana
    .filter(t => t.categoria === 'Entretenimiento' || t.categoria === 'Alimentación')
    .reduce((s, t) => s + t.monto, 0)

  if (gastosEntretenimiento > 0 && entrenosEstaSemana.length === 0) {
    insights.push({
      emoji: '🍔',
      tipo: 'alerta',
      mensaje: `Esta semana gastaste en alimentación/entretenimiento pero no registraste entrenamientos. Considera balancear con algo de actividad física.`,
    })
  }

  // --- Promedio académico ---
  if (notas.length >= 2) {
    const notasOrdenadas = [...notas].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    const mitad = Math.floor(notasOrdenadas.length / 2)
    const promedioAnterior = notasOrdenadas.slice(0, mitad).reduce((s, n) => s + n.nota, 0) / mitad
    const promedioReciente = notasOrdenadas.slice(mitad).reduce((s, n) => s + n.nota, 0) / (notasOrdenadas.length - mitad)

    if (promedioReciente < promedioAnterior - 0.3) {
      insights.push({
        emoji: '📉',
        tipo: 'alerta',
        mensaje: `Tu promedio reciente (${promedioReciente.toFixed(1)}) bajó respecto al anterior (${promedioAnterior.toFixed(1)}). ${
          entrenosEstaSemana.length === 0 ? 'También llevas poca actividad física esta semana — el ejercicio ayuda a la concentración.' : 'Revisa tus hábitos de estudio recientes.'
        }`,
      })
    } else if (promedioReciente > promedioAnterior + 0.3) {
      insights.push({
        emoji: '📈',
        tipo: 'positivo',
        mensaje: `Tu promedio mejoró de ${promedioAnterior.toFixed(1)} a ${promedioReciente.toFixed(1)}. ¡Buen trabajo!`,
      })
    }
  }

  // --- Balance financiero del mes ---
  const mesActual = new Date().toISOString().slice(0, 7)
  const transaccionesMes = transacciones.filter(t => t.fecha.startsWith(mesActual))
  const ingresosMes = transaccionesMes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0)
  const gastosMes = transaccionesMes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0)

  if (ingresosMes > 0) {
    const porcentajeGastado = (gastosMes / ingresosMes) * 100
    if (porcentajeGastado > 90) {
      insights.push({
        emoji: '💸',
        tipo: 'alerta',
        mensaje: `Llevas gastado el ${porcentajeGastado.toFixed(0)}% de tus ingresos este mes. Cuida tu presupuesto para los próximos días.`,
      })
    } else if (porcentajeGastado < 50) {
      insights.push({
        emoji: '✅',
        tipo: 'positivo',
        mensaje: `Vas muy bien con tus finanzas este mes — solo has gastado el ${porcentajeGastado.toFixed(0)}% de tus ingresos.`,
      })
    }
  }

  // --- Racha de entrenamientos ---
  if (entrenamientos.length >= 3) {
    const ultimosTres = [...entrenamientos]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 3)
    const todosAltaIntensidad = ultimosTres.every(e => e.intensidad === 'alta')
    if (todosAltaIntensidad) {
      insights.push({
        emoji: '🛌',
        tipo: 'info',
        mensaje: `Tus últimos 3 entrenamientos fueron de intensidad alta. Considera incluir un día de descanso o recuperación activa.`,
      })
    }
  }

  if (insights.length === 0) {
    insights.push({
      emoji: '👋',
      tipo: 'info',
      mensaje: `Sigue registrando tus datos en los módulos. Mientras más información tengas, mejores recomendaciones podremos darte.`,
    })
  }

  return insights
}