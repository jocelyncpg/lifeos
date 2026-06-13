'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Nota = {
  id: string
  evaluacion: string
  nota: number
  porcentaje: number
  fecha: string
}

type Ramo = {
  id: string
  nombre: string
  profesor: string
  creditos: number
  notas: Nota[]
}

export default function AcademicoPage() {
  const [ramos, setRamos] = useState<Ramo[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormRamo, setMostrarFormRamo] = useState(false)
  const [ramoSeleccionado, setRamoSeleccionado] = useState<Ramo | null>(null)
  const [mostrarFormNota, setMostrarFormNota] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Form ramo
  const [nombre, setNombre] = useState('')
  const [profesor, setProfesor] = useState('')
  const [creditos, setCreditos] = useState('3')

  // Form nota
  const [evaluacion, setEvaluacion] = useState('')
  const [nota, setNota] = useState('')
  const [porcentaje, setPorcentaje] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  const supabase = createClient()

  useEffect(() => {
    cargarRamos()
  }, [])

  const cargarRamos = async () => {
    const { data: ramosData } = await supabase
      .from('ramos')
      .select('*')
      .order('created_at', { ascending: true })

    if (!ramosData) return setLoading(false)

    const ramosConNotas = await Promise.all(
      ramosData.map(async (r) => {
        const { data: notasData } = await supabase
          .from('notas')
          .select('*')
          .eq('ramo_id', r.id)
          .order('fecha', { ascending: true })
        return { ...r, notas: notasData || [] }
      })
    )

    setRamos(ramosConNotas)
    setLoading(false)
  }

  const agregarRamo = async () => {
    setErrorMsg('')
    if (!nombre) { setErrorMsg('El nombre es obligatorio.'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErrorMsg('No hay sesión activa.'); return }

    const { error } = await supabase.from('ramos').insert({
      user_id: user.id,
      nombre,
      profesor,
      creditos: parseInt(creditos),
    })

    if (error) { setErrorMsg('Error: ' + error.message); return }

    setNombre('')
    setProfesor('')
    setCreditos('3')
    setMostrarFormRamo(false)
    cargarRamos()
  }

  const eliminarRamo = async (id: string) => {
    await supabase.from('ramos').delete().eq('id', id)
    if (ramoSeleccionado?.id === id) setRamoSeleccionado(null)
    cargarRamos()
  }

  const agregarNota = async () => {
    setErrorMsg('')
    if (!evaluacion || !nota || !porcentaje) {
      setErrorMsg('Completa todos los campos.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ramoSeleccionado) return

    const { error } = await supabase.from('notas').insert({
      user_id: user.id,
      ramo_id: ramoSeleccionado.id,
      evaluacion,
      nota: parseFloat(nota),
      porcentaje: parseInt(porcentaje),
      fecha,
    })

    if (error) { setErrorMsg('Error: ' + error.message); return }

    setEvaluacion('')
    setNota('')
    setPorcentaje('')
    setMostrarFormNota(false)
    const ramosActualizados = await cargarRamosYRetornar()
    const ramoActualizado = ramosActualizados.find(r => r.id === ramoSeleccionado.id)
    if (ramoActualizado) setRamoSeleccionado(ramoActualizado)
  }

  const cargarRamosYRetornar = async () => {
    const { data: ramosData } = await supabase
      .from('ramos')
      .select('*')
      .order('created_at', { ascending: true })

    if (!ramosData) return []

    const ramosConNotas = await Promise.all(
      ramosData.map(async (r) => {
        const { data: notasData } = await supabase
          .from('notas')
          .select('*')
          .eq('ramo_id', r.id)
          .order('fecha', { ascending: true })
        return { ...r, notas: notasData || [] }
      })
    )

    setRamos(ramosConNotas)
    return ramosConNotas
  }

  const eliminarNota = async (notaId: string) => {
    await supabase.from('notas').delete().eq('id', notaId)
    const ramosActualizados = await cargarRamosYRetornar()
    const ramoActualizado = ramosActualizados.find(r => r.id === ramoSeleccionado?.id)
    if (ramoActualizado) setRamoSeleccionado(ramoActualizado)
  }

  const calcularPromedio = (notas: Nota[]) => {
    if (notas.length === 0) return null
    const totalPorcentaje = notas.reduce((sum, n) => sum + n.porcentaje, 0)
    if (totalPorcentaje === 0) return null
    const promedio = notas.reduce((sum, n) => sum + (n.nota * n.porcentaje) / 100, 0)
    return (promedio * 100 / totalPorcentaje).toFixed(1)
  }

  const colorNota = (n: number) => {
    if (n >= 5.0) return 'text-green-600'
    if (n >= 4.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🎓 Académico</h2>
          <p className="text-gray-500 text-sm mt-1">Gestiona tus ramos y notas</p>
        </div>
        <button
          onClick={() => setMostrarFormRamo(!mostrarFormRamo)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Nuevo ramo
        </button>
      </div>

      {/* Form nuevo ramo */}
      {mostrarFormRamo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Nuevo ramo</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Bases de Datos"
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Profesor</label>
              <input
                type="text"
                value={profesor}
                onChange={e => setProfesor(e.target.value)}
                placeholder="Opcional"
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Créditos</label>
              <input
                type="number"
                value={creditos}
                onChange={e => setCreditos(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setMostrarFormRamo(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={agregarRamo} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Lista de ramos */}
        <div className="col-span-1 space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Mis ramos</h3>
          {loading ? (
            <p className="text-gray-400 text-sm">Cargando...</p>
          ) : ramos.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay ramos aún.</p>
          ) : (
            ramos.map(r => {
              const promedio = calcularPromedio(r.notas)
              const isSelected = ramoSeleccionado?.id === r.id
              return (
                <div
                  key={r.id}
                  onClick={() => setRamoSeleccionado(r)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-white hover:shadow-sm'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{r.nombre}</p>
                      {r.profesor && <p className="text-xs text-gray-400 mt-0.5">{r.profesor}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {promedio && (
                        <span className={`text-sm font-bold ${colorNota(parseFloat(promedio))}`}>
                          {promedio}
                        </span>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); eliminarRamo(r.id) }}
                        className="text-gray-300 hover:text-red-400 text-xs"
                      >✕</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{r.notas.length} evaluación(es) · {r.creditos} créditos</p>
                </div>
              )
            })
          )}
        </div>

        {/* Detalle ramo seleccionado */}
        <div className="col-span-2">
          {!ramoSeleccionado ? (
            <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-400 text-sm">Selecciona un ramo para ver sus notas</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800">{ramoSeleccionado.nombre}</h3>
                  {ramoSeleccionado.profesor && <p className="text-sm text-gray-400">{ramoSeleccionado.profesor}</p>}
                </div>
                <div className="text-right">
                  {calcularPromedio(ramoSeleccionado.notas) && (
                    <div>
                      <p className="text-xs text-gray-400">Promedio actual</p>
                      <p className={`text-3xl font-bold ${colorNota(parseFloat(calcularPromedio(ramoSeleccionado.notas)!))}`}>
                        {calcularPromedio(ramoSeleccionado.notas)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setMostrarFormNota(!mostrarFormNota)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
              >
                + Agregar nota
              </button>

              {mostrarFormNota && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Evaluación</label>
                      <input
                        type="text"
                        value={evaluacion}
                        onChange={e => setEvaluacion(e.target.value)}
                        placeholder="Ej: Certamen 1"
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nota (1.0 - 7.0)</label>
                      <input
                        type="number"
                        value={nota}
                        onChange={e => setNota(e.target.value)}
                        step="0.1"
                        min="1"
                        max="7"
                        placeholder="Ej: 5.5"
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Porcentaje (%)</label>
                      <input
                        type="number"
                        value={porcentaje}
                        onChange={e => setPorcentaje(e.target.value)}
                        min="1"
                        max="100"
                        placeholder="Ej: 30"
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      />
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
                  </div>
                  {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setMostrarFormNota(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
                    <button onClick={agregarNota} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                  </div>
                </div>
              )}

              {ramoSeleccionado.notas.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay notas registradas aún.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase border-b">
                      <th className="pb-2">Evaluación</th>
                      <th className="pb-2">Nota</th>
                      <th className="pb-2">Porcentaje</th>
                      <th className="pb-2">Fecha</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ramoSeleccionado.notas.map(n => (
                      <tr key={n.id}>
                        <td className="py-2 text-gray-700">{n.evaluacion}</td>
                        <td className={`py-2 font-semibold ${colorNota(n.nota)}`}>{n.nota.toFixed(1)}</td>
                        <td className="py-2 text-gray-500">{n.porcentaje}%</td>
                        <td className="py-2 text-gray-400">{n.fecha}</td>
                        <td className="py-2">
                          <button onClick={() => eliminarNota(n.id)} className="text-gray-300 hover:text-red-400">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}