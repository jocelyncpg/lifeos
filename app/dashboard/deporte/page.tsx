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
  baja: 'bg-green-100 text-green-700',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-red-100 text-red-700',
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
          <h2 className="text-2xl font-bold text-gray-800">💪 Deporte</h2>
          <p className="text-gray-500 text-sm mt-1">Registra tus entrenamientos</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Nuevo entrenamiento
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Total entrenamientos</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{entrenamientos.length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-sm text-purple-600 font-medium">Tiempo total</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{totalHoras}h {minutosRestantes}m</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <p className="text-sm text-orange-600 font-medium">Deportes distintos</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">{porDeporte.length}</p>
        </div>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Nuevo entrenamiento</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Deporte</label>
              <select
                value={deporte}
                onChange={e => setDeporte(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              >
                {deportes.map(d => (
                  <option key={d} value={d}>{deporteEmoji[d]} {d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Duración (minutos)</label>
              <input
                type="number"
                value={duracion}
                onChange={e => setDuracion(e.target.value)}
                placeholder="Ej: 60"
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Intensidad</label>
              <div className="flex gap-2 mt-1">
                {(['baja', 'media', 'alta'] as const).map(i => (
                  <button
                    key={i}
                    onClick={() => setIntensidad(i)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${intensidad === i ? intensidadColor[i] : 'bg-gray-100 text-gray-500'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Ej: 10 rounds de sparring"
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

          <div className="flex gap-2 justify-end">
            <button onClick={() => setMostrarForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={agregarEntrenamiento} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Lista entrenamientos */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">Historial</h3>
          </div>
          {loading ? (
            <p className="p-4 text-gray-400 text-sm">Cargando...</p>
          ) : entrenamientos.length === 0 ? (
            <p className="p-4 text-gray-400 text-sm">No hay entrenamientos aún.</p>
          ) : (
            <ul className="divide-y">
              {entrenamientos.map(e => (
                <li key={e.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{deporteEmoji[e.deporte] || '💪'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.deporte}</p>
                      <p className="text-xs text-gray-400">{e.descripcion || '—'} · {e.fecha}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${intensidadColor[e.intensidad]}`}>
                      {e.intensidad}
                    </span>
                    <span className="text-sm text-gray-500">{e.duracion} min</span>
                    <button
                      onClick={() => eliminarEntrenamiento(e.id)}
                      className="text-gray-300 hover:text-red-400 text-xs"
                    >✕</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Por deporte */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">Por deporte</h3>
          </div>
          {porDeporte.length === 0 ? (
            <p className="p-4 text-gray-400 text-sm">Sin datos aún.</p>
          ) : (
            <ul className="divide-y">
              {porDeporte.map(d => (
                <li key={d.deporte} className="px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{deporteEmoji[d.deporte]} {d.deporte}</span>
                    <span className="text-xs text-gray-400">{d.count}x</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{Math.floor(d.minutos / 60)}h {d.minutos % 60}m total</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}