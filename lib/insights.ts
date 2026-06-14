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
  
  export function generarInsights(
    transacciones: Transaccion[],
    notas: Nota[],
    entrenamientos: Entrenamiento[]
  ): Insight[] {
    const insights: Insight[] = []
  
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
        mensaje: `Sigue registrando tus datos en los 3 módulos. Mientras más información tengas, mejores recomendaciones podremos darte.`,
      })
    }
  
    return insights
  }