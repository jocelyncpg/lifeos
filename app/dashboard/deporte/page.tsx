'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Entrenamiento = {
  id: string
  deporte: string
  duracion: number
  intensidad: 'baja' | 'media' | 'alta'
  descripcion: string
  fecha: string
}

const deportes = ['Boxeo', 'Escalada', 'Natación', 'Trekking', 'Ciclismo', 'Fútbol', 'Tenis', 'Yoga', 'Gym', 'Otro']

const intensidadColor = {
  baja: 'bg-green-500/10 text-green-400',
  media: 'bg-yellow-500/10 text-yellow-400',
  alta: 'bg-red-500/10 text-red-400',
}

const deporteEmoji: Record<string, string> = {
  Boxeo: '🥊',
  Escalada: '🧗',
  Natación: '🏊',
  Trekking: '🥾',
  Ciclismo: '🚲',
  Fútbol: '⚽',
  Tenis: '🎾',
  Yoga: '🧘',
  Gym: '🏋️',
  Otro: '💪',
}

export default function DeportePage() {
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [deporte, setDeporte] = useState('Boxeo')
  const [duracion, setDuracion] = useState('')
  const [intensidad, setIntensidad] = useState<'baja' | 'media' | 'alta'>('media')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  const supabase = createClient()

  useEffect(() => {
    cargarEntrenamientos()
  }, [])

  const cargarEntrenamientos = async () => {
    const { data } = await supabase
      .from('entrenamientos')
      .select('*')
      .order('fecha', { ascending: false })
    if (data) setEntrenamientos(data)
    setLoading(false)
  }

  const agregarEntrenamiento = async () => {
    setErrorMsg('')
    if (!duracion) { setErrorMsg('Ingresa la duración.'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErrorMsg('No hay sesión activa.'); return }

    const { error } = await supabase.from('entrenamientos').insert({
      user_id: user.id,
      deporte,
      duracion: parseInt(duracion),
      intensidad,
      descripcion,
      fecha,
    })

    if (error) { setErrorMsg('Error: ' + error.message); return }

    setDuracion('')
    setDescripcion('')
    setMostrarForm(false)
    cargarEntrenamientos()
  }

  const eliminarEntrenamiento = async (id: string) => {
    await supabase.from('entrenamientos').delete().eq('id', id)
    cargarEntrenamientos()
  }

  const totalMinutes = entrenamientos.reduce((sum, e) => sum + e.duracion, 0)
  const totalHoras = Math.floor(totalMinutes / 60)
  const minutosRestantes = totalMinutes % 60

  const porDeporte = deportes.map(d => ({
    deporte: d,
    count: entrenamientos.filter(e => e.deporte === d).length,
    minutos: entrenamientos.filter(e => e.deporte === d).reduce((sum, e) => sum + e.duracion, 0),
  })).filter(d => d.count > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#F4F6FB]">💪 Deporte</h2>
          <p className="text-[#8C97B5] text-sm mt-1">Registra tus entrenamientos</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-[#00E5C7] text-[#04342C] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00E5C7]/80"
        >
          + Nuevo entrenamiento
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#00E5C7]/10 border border-[#00E5C7]/20 rounded-xl p-4">
          <p className="text-sm text-[#00E5C7] font-medium">Total entrenamientos</p>
          <p className="text-2xl font-bold text-[#00E5C7] mt-1">{entrenamientos.length}</p>
        </div>
        <div className="bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 rounded-xl p-4">
          <p className="text-sm text-[#7C5CFC] font-medium">Tiempo total</p>
          <p className="text-2xl font-bold text-[#7C5CFC] mt-1">{totalHoras}h {minutosRestantes}m</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <p className="text-sm text-orange-400 font-medium">Deportes distintos</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{porDeporte.length}</p>
        </div>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-6 space-y-4">
          <h3 className="font-semibold text-[#F4F6FB]">Nuevo entrenamiento</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#8C97B5]">Deporte</label>
              <select
                value={deporte}
                onChange={e => setDeporte(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB]"
              >
                {deportes.map(d => (
                  <option key={d} value={d}>{deporteEmoji[d]} {d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#8C97B5]">Duración (minutos)</label>
              <input
                type="number"
                value={duracion}
                onChange={e => setDuracion(e.target.value)}
                placeholder="Ej: 60"
                className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#8C97B5]">Intensidad</label>
              <div className="flex gap-2 mt-1">
                {(['baja', 'media', 'alta'] as const).map(i => (
                  <button
                    key={i}
                    onClick={() => setIntensidad(i)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${intensidad === i ? intensidadColor[i] : 'bg-[#1E293B] text-[#8C97B5]'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#8C97B5]">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB]"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-[#8C97B5]">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Ej: 10 rounds de sparring"
                className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
              />
            </div>
          </div>

          {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

          <div className="flex gap-2 justify-end">
            <button onClick={() => setMostrarForm(false)} className="px-4 py-2 text-sm text-[#8C97B5] hover:bg-white/5 rounded-lg">Cancelar</button>
            <button onClick={agregarEntrenamiento} className="px-4 py-2 text-sm bg-[#00E5C7] text-[#04342C] font-medium rounded-lg hover:bg-[#00E5C7]/80">Guardar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Lista entrenamientos */}
        <div className="col-span-2 bg-[#131B2E] rounded-xl border border-[#1E293B]">
          <div className="p-4 border-b border-[#1E293B]">
            <h3 className="font-semibold text-[#F4F6FB]">Historial</h3>
          </div>
          {loading ? (
            <p className="p-4 text-[#8C97B5] text-sm">Cargando...</p>
          ) : entrenamientos.length === 0 ? (
            <p className="p-4 text-[#8C97B5] text-sm">No hay entrenamientos aún.</p>
          ) : (
            <ul className="divide-y divide-[#1E293B]">
              {entrenamientos.map(e => (
                <li key={e.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{deporteEmoji[e.deporte] || '💪'}</span>
                    <div>
                      <p className="text-sm font-medium text-[#F4F6FB]">{e.deporte}</p>
                      <p className="text-xs text-[#8C97B5]">{e.descripcion || '—'} · {e.fecha}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${intensidadColor[e.intensidad]}`}>
                      {e.intensidad}
                    </span>
                    <span className="text-sm text-[#8C97B5]">{e.duracion} min</span>
                    <button
                      onClick={() => eliminarEntrenamiento(e.id)}
                      className="text-[#8C97B5]/40 hover:text-red-400 text-xs"
                    >✕</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Por deporte */}
        <div className="bg-[#131B2E] rounded-xl border border-[#1E293B]">
          <div className="p-4 border-b border-[#1E293B]">
            <h3 className="font-semibold text-[#F4F6FB]">Por deporte</h3>
          </div>
          {porDeporte.length === 0 ? (
            <p className="p-4 text-[#8C97B5] text-sm">Sin datos aún.</p>
          ) : (
            <ul className="divide-y divide-[#1E293B]">
              {porDeporte.map(d => (
                <li key={d.deporte} className="px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#F4F6FB]">{deporteEmoji[d.deporte]} {d.deporte}</span>
                    <span className="text-xs text-[#8C97B5]">{d.count}x</span>
                  </div>
                  <p className="text-xs text-[#8C97B5] mt-0.5">{Math.floor(d.minutos / 60)}h {d.minutos % 60}m total</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}