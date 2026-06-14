'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Evento = {
  id: string
  titulo: string
  descripcion: string
  fecha: string
  hora: string | null
  tipo: 'academico' | 'salud' | 'personal' | 'deporte' | 'otro'
  completado: boolean
}

const tiposInfo: Record<string, { label: string; color: string; dot: string }> = {
  academico: { label: 'Académico', color: 'bg-[#7C5CFC]/10 text-[#7C5CFC] border-[#7C5CFC]/20', dot: 'bg-[#7C5CFC]' },
  salud: { label: 'Salud', color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
  personal: { label: 'Personal', color: 'bg-[#00E5C7]/10 text-[#00E5C7] border-[#00E5C7]/20', dot: 'bg-[#00E5C7]' },
  deporte: { label: 'Deporte', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
  otro: { label: 'Otro', color: 'bg-[#8C97B5]/10 text-[#8C97B5] border-[#8C97B5]/20', dot: 'bg-[#8C97B5]' },
}

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function formatFecha(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [mesActual, setMesActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(formatFecha(new Date()))
  const [mostrarForm, setMostrarForm] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [hora, setHora] = useState('')
  const [tipo, setTipo] = useState<Evento['tipo']>('personal')

  const supabase = createClient()

  useEffect(() => {
    cargarEventos()
  }, [])

  const cargarEventos = async () => {
    const { data } = await supabase
      .from('eventos')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })
    if (data) setEventos(data)
    setLoading(false)
  }

  const agregarEvento = async () => {
    setErrorMsg('')
    if (!titulo) { setErrorMsg('El título es obligatorio.'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErrorMsg('No hay sesión activa.'); return }

    const { error } = await supabase.from('eventos').insert({
      user_id: user.id,
      titulo,
      descripcion,
      fecha: diaSeleccionado,
      hora: hora || null,
      tipo,
    })

    if (error) { setErrorMsg('Error: ' + error.message); return }

    setTitulo('')
    setDescripcion('')
    setHora('')
    setTipo('personal')
    setMostrarForm(false)
    cargarEventos()
  }

  const toggleCompletado = async (id: string, actual: boolean) => {
    await supabase.from('eventos').update({ completado: !actual }).eq('id', id)
    cargarEventos()
  }

  const eliminarEvento = async (id: string) => {
    await supabase.from('eventos').delete().eq('id', id)
    cargarEventos()
  }

  // --- Generar grilla del mes ---
  const year = mesActual.getFullYear()
  const month = mesActual.getMonth()
  const primerDia = new Date(year, month, 1)
  const ultimoDia = new Date(year, month + 1, 0)
  const offsetInicio = (primerDia.getDay() + 6) % 7 // lunes = 0
  const diasEnMes = ultimoDia.getDate()

  const celdas: (string | null)[] = []
  for (let i = 0; i < offsetInicio; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(formatFecha(new Date(year, month, d)))

  const eventosPorFecha = (fecha: string) => eventos.filter(e => e.fecha === fecha)

  const hoy = formatFecha(new Date())

  const cambiarMes = (delta: number) => {
    setMesActual(new Date(year, month + delta, 1))
  }

  // --- Próximos eventos ---
  const proximosEventos = eventos
    .filter(e => e.fecha >= hoy && !e.completado)
    .slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#F4F6FB]">🗓️ Calendario</h2>
          <p className="text-[#8C97B5] text-sm mt-1">Organiza tus eventos y recordatorios</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-[#00E5C7] text-[#04342C] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00E5C7]/80"
        >
          + Nuevo evento
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-6 space-y-4">
          <h3 className="font-semibold text-[#F4F6FB]">Nuevo evento — {diaSeleccionado}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-[#8C97B5]">Título</label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ej: Entrega de proyecto"
                className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#8C97B5]">Hora (opcional)</label>
              <input
                type="time"
                value={hora}
                onChange={e => setHora(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#8C97B5]">Tipo</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as Evento['tipo'])}
                className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB]"
              >
                {Object.entries(tiposInfo).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-[#8C97B5]">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Opcional"
                className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
              />
            </div>
          </div>
          {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setMostrarForm(false)} className="px-4 py-2 text-sm text-[#8C97B5] hover:bg-white/5 rounded-lg">Cancelar</button>
            <button onClick={agregarEvento} className="px-4 py-2 text-sm bg-[#00E5C7] text-[#04342C] font-medium rounded-lg hover:bg-[#00E5C7]/80">Guardar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="col-span-2 bg-[#131B2E] rounded-xl border border-[#1E293B] p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => cambiarMes(-1)} className="text-[#8C97B5] hover:text-[#F4F6FB] px-2">←</button>
            <h3 className="font-semibold text-[#F4F6FB]">{meses[month]} {year}</h3>
            <button onClick={() => cambiarMes(1)} className="text-[#8C97B5] hover:text-[#F4F6FB] px-2">→</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#8C97B5] mb-2">
            {diasSemana.map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {celdas.map((fecha, i) => {
              if (!fecha) return <div key={i} />
              const eventosDelDia = eventosPorFecha(fecha)
              const esHoy = fecha === hoy
              const esSeleccionado = fecha === diaSeleccionado
              return (
                <button
                  key={fecha}
                  onClick={() => setDiaSeleccionado(fecha)}
                  className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-start text-xs transition-colors ${
                    esSeleccionado ? 'bg-[#00E5C7]/10 border border-[#00E5C7]/40' :
                    esHoy ? 'border border-[#1E293B]' : 'hover:bg-white/5'
                  }`}
                >
                  <span className={esHoy ? 'text-[#00E5C7] font-semibold' : 'text-[#F4F6FB]'}>
                    {parseInt(fecha.split('-')[2])}
                  </span>
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {eventosDelDia.slice(0, 3).map(e => (
                      <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${tiposInfo[e.tipo].dot}`} />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Eventos del día seleccionado + próximos */}
        <div className="space-y-4">
          <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-4">
            <h3 className="font-semibold text-[#F4F6FB] text-sm mb-3">{diaSeleccionado}</h3>
            {eventosPorFecha(diaSeleccionado).length === 0 ? (
              <p className="text-[#8C97B5] text-sm">Sin eventos este día.</p>
            ) : (
              <div className="space-y-2">
                {eventosPorFecha(diaSeleccionado).map(e => (
                  <div key={e.id} className={`p-2 rounded-lg border text-xs ${tiposInfo[e.tipo].color}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${e.completado ? 'line-through opacity-50' : ''}`}>{e.titulo}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleCompletado(e.id, e.completado)} className="opacity-60 hover:opacity-100">
                          {e.completado ? '↺' : '✓'}
                        </button>
                        <button onClick={() => eliminarEvento(e.id)} className="opacity-60 hover:opacity-100">✕</button>
                      </div>
                    </div>
                    {e.hora && <p className="opacity-70 mt-0.5">{e.hora.slice(0,5)}</p>}
                    {e.descripcion && <p className="opacity-70 mt-0.5">{e.descripcion}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-4">
            <h3 className="font-semibold text-[#F4F6FB] text-sm mb-3">Próximos eventos</h3>
            {loading ? (
              <p className="text-[#8C97B5] text-sm">Cargando...</p>
            ) : proximosEventos.length === 0 ? (
              <p className="text-[#8C97B5] text-sm">No tienes eventos próximos.</p>
            ) : (
              <div className="space-y-2">
                {proximosEventos.map(e => (
                  <div key={e.id} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${tiposInfo[e.tipo].dot}`} />
                    <span className="text-[#F4F6FB] flex-1">{e.titulo}</span>
                    <span className="text-[#8C97B5]">{e.fecha.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}