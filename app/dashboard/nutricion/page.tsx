'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type RegistroComida = {
  id: string
  nombre: string
  tipo: 'desayuno' | 'almuerzo' | 'cena' | 'snack'
  calorias: number | null
  proteinas: number | null
  carbohidratos: number | null
  grasas: number | null
  fecha: string
}

type RegistroPeso = {
  id: string
  peso: number
  fecha: string
}

const tipoColor: Record<string, string> = {
  desayuno: 'bg-yellow-500/10 text-yellow-400',
  almuerzo: 'bg-green-500/10 text-green-400',
  cena: 'bg-blue-500/10 text-blue-400',
  snack: 'bg-purple-500/10 text-purple-400',
}

const tipoEmoji: Record<string, string> = {
  desayuno: '🌅',
  almuerzo: '☀️',
  cena: '🌙',
  snack: '🍎',
}

export default function NutricionPage() {
  const [comidas, setComidas] = useState<RegistroComida[]>([])
  const [pesos, setPesos] = useState<RegistroPeso[]>([])
  const [loading, setLoading] = useState(true)
  const [tabActivo, setTabActivo] = useState<'comidas' | 'peso'>('comidas')
  const [errorMsg, setErrorMsg] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  const [mostrarFormComida, setMostrarFormComida] = useState(false)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<RegistroComida['tipo']>('almuerzo')
  const [calorias, setCalorias] = useState('')
  const [proteinas, setProteinas] = useState('')
  const [carbohidratos, setCarbohidratos] = useState('')
  const [grasas, setGrasas] = useState('')

  const [mostrarFormPeso, setMostrarFormPeso] = useState(false)
  const [peso, setPeso] = useState('')
  const [fechaPeso, setFechaPeso] = useState(new Date().toISOString().split('T')[0])

  const supabase = createClient()

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    const { data: comidasData } = await supabase
      .from('registros_comida')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
    if (comidasData) setComidas(comidasData)

    const { data: pesosData } = await supabase
      .from('registros_peso')
      .select('*')
      .order('fecha', { ascending: false })
    if (pesosData) setPesos(pesosData)

    setLoading(false)
  }

  const agregarComida = async () => {
    setErrorMsg('')
    if (!nombre) { setErrorMsg('El nombre es obligatorio.'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErrorMsg('No hay sesión activa.'); return }
    const { error } = await supabase.from('registros_comida').insert({
      user_id: user.id,
      nombre,
      tipo,
      calorias: calorias ? parseInt(calorias) : null,
      proteinas: proteinas ? parseFloat(proteinas) : null,
      carbohidratos: carbohidratos ? parseFloat(carbohidratos) : null,
      grasas: grasas ? parseFloat(grasas) : null,
      fecha,
    })
    if (error) { setErrorMsg('Error: ' + error.message); return }
    setNombre(''); setCalorias(''); setProteinas(''); setCarbohidratos(''); setGrasas('')
    setMostrarFormComida(false)
    cargarDatos()
  }

  const eliminarComida = async (id: string) => {
    await supabase.from('registros_comida').delete().eq('id', id)
    cargarDatos()
  }

  const agregarPeso = async () => {
    setErrorMsg('')
    if (!peso) { setErrorMsg('Ingresa tu peso.'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErrorMsg('No hay sesión activa.'); return }
    const { error } = await supabase.from('registros_peso').insert({
      user_id: user.id,
      peso: parseFloat(peso),
      fecha: fechaPeso,
    })
    if (error) { setErrorMsg('Error: ' + error.message); return }
    setPeso('')
    setMostrarFormPeso(false)
    cargarDatos()
  }

  const eliminarPeso = async (id: string) => {
    await supabase.from('registros_peso').delete().eq('id', id)
    cargarDatos()
  }

  const comidasHoy = comidas.filter(c => c.fecha === fecha)
  const caloriasHoy = comidasHoy.reduce((s, c) => s + (c.calorias || 0), 0)
  const proteinasHoy = comidasHoy.reduce((s, c) => s + (c.proteinas || 0), 0)
  const carbsHoy = comidasHoy.reduce((s, c) => s + (c.carbohidratos || 0), 0)
  const grasasHoy = comidasHoy.reduce((s, c) => s + (c.grasas || 0), 0)

  const ultimoPeso = pesos[0]?.peso || null
  const pesoPrevio = pesos[1]?.peso || null
  const diferenciaPeso = ultimoPeso && pesoPrevio ? (ultimoPeso - pesoPrevio).toFixed(1) : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[#F4F6FB]">🍽️ Nutrición</h2>
        <p className="text-[#8C97B5] text-sm mt-1">Registro de comidas y seguimiento de peso</p>
      </div>

      {/* Tabs móvil */}
      <div className="flex gap-2 border-b border-[#1E293B] pb-2">
        <button
          onClick={() => setTabActivo('comidas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tabActivo === 'comidas' ? 'bg-[#00E5C7]/10 text-[#00E5C7]' : 'text-[#8C97B5]'}`}
        >
          🍽️ Comidas
        </button>
        <button
          onClick={() => setTabActivo('peso')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tabActivo === 'peso' ? 'bg-[#00E5C7]/10 text-[#00E5C7]' : 'text-[#8C97B5]'}`}
        >
          ⚖️ Peso
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Comidas */}
        <div className={`space-y-4 ${tabActivo === 'peso' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-[#F4F6FB]">Comidas</h3>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="px-2 py-1 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-xs text-[#8C97B5]"
              />
            </div>
            <button
              onClick={() => setMostrarFormComida(!mostrarFormComida)}
              className="bg-[#00E5C7] text-[#04342C] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#00E5C7]/80"
            >
              + Agregar
            </button>
          </div>

          {/* Resumen del día */}
          {comidasHoy.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <p className="text-xs text-orange-400">Calorías</p>
                <p className="text-lg font-bold text-orange-400">{caloriasHoy}</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-400">Proteínas</p>
                <p className="text-lg font-bold text-blue-400">{proteinasHoy.toFixed(1)}g</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-400">Carbs</p>
                <p className="text-lg font-bold text-yellow-400">{carbsHoy.toFixed(1)}g</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-400">Grasas</p>
                <p className="text-lg font-bold text-red-400">{grasasHoy.toFixed(1)}g</p>
              </div>
            </div>
          )}

          {mostrarFormComida && (
            <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[#8C97B5]">Nombre</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Ej: Avena con frutas"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[#8C97B5]">Tipo</label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {(['desayuno', 'almuerzo', 'cena', 'snack'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTipo(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${tipo === t ? tipoColor[t] : 'bg-[#1E293B] text-[#8C97B5]'}`}
                      >
                        {tipoEmoji[t]} {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Calorías</label>
                  <input
                    type="number"
                    value={calorias}
                    onChange={e => setCalorias(e.target.value)}
                    placeholder="Opcional"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Proteínas (g)</label>
                  <input
                    type="number"
                    value={proteinas}
                    onChange={e => setProteinas(e.target.value)}
                    placeholder="Opcional"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Carbohidratos (g)</label>
                  <input
                    type="number"
                    value={carbohidratos}
                    onChange={e => setCarbohidratos(e.target.value)}
                    placeholder="Opcional"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Grasas (g)</label>
                  <input
                    type="number"
                    value={grasas}
                    onChange={e => setGrasas(e.target.value)}
                    placeholder="Opcional"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
              </div>
              {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setMostrarFormComida(false)} className="px-3 py-1.5 text-sm text-[#8C97B5] hover:bg-white/5 rounded-lg">Cancelar</button>
                <button onClick={agregarComida} className="px-3 py-1.5 text-sm bg-[#00E5C7] text-[#04342C] font-medium rounded-lg hover:bg-[#00E5C7]/80">Guardar</button>
              </div>
            </div>
          )}

          <div className="bg-[#131B2E] rounded-xl border border-[#1E293B]">
            {loading ? (
              <p className="p-4 text-[#8C97B5] text-sm">Cargando...</p>
            ) : comidasHoy.length === 0 ? (
              <p className="p-4 text-[#8C97B5] text-sm">No hay comidas registradas para este día.</p>
            ) : (
              <ul className="divide-y divide-[#1E293B]">
                {(['desayuno', 'almuerzo', 'cena', 'snack'] as const).map(t => {
                  const comidasTipo = comidasHoy.filter(c => c.tipo === t)
                  if (comidasTipo.length === 0) return null
                  return (
                    <div key={t}>
                      <div className="px-4 py-2 border-b border-[#1E293B]">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor[t]}`}>
                          {tipoEmoji[t]} {t}
                        </span>
                      </div>
                      {comidasTipo.map(c => (
                        <li key={c.id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-[#F4F6FB]">{c.nombre}</p>
                            <p className="text-xs text-[#8C97B5]">
                              {c.calorias ? `${c.calorias} kcal` : ''}
                              {c.proteinas ? ` · ${c.proteinas}g prot` : ''}
                            </p>
                          </div>
                          <button onClick={() => eliminarComida(c.id)} className="text-[#8C97B5]/40 hover:text-red-400 text-xs">✕</button>
                        </li>
                      ))}
                    </div>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Peso */}
        <div className={`space-y-4 ${tabActivo === 'comidas' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#F4F6FB]">Seguimiento de peso</h3>
            <button
              onClick={() => setMostrarFormPeso(!mostrarFormPeso)}
              className="bg-[#00E5C7] text-[#04342C] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#00E5C7]/80"
            >
              + Registrar
            </button>
          </div>

          {/* Resumen peso */}
          {ultimoPeso && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#00E5C7]/10 border border-[#00E5C7]/20 rounded-xl p-4">
                <p className="text-xs text-[#00E5C7]">Peso actual</p>
                <p className="text-2xl font-bold text-[#00E5C7] mt-1">{ultimoPeso} kg</p>
                <p className="text-xs text-[#8C97B5] mt-1">{pesos[0]?.fecha}</p>
              </div>
              {diferenciaPeso && (
                <div className={`rounded-xl p-4 border ${parseFloat(diferenciaPeso) <= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                  <p className={`text-xs ${parseFloat(diferenciaPeso) <= 0 ? 'text-green-400' : 'text-orange-400'}`}>Cambio</p>
                  <p className={`text-2xl font-bold mt-1 ${parseFloat(diferenciaPeso) <= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                    {parseFloat(diferenciaPeso) > 0 ? '+' : ''}{diferenciaPeso} kg
                  </p>
                  <p className="text-xs text-[#8C97B5] mt-1">vs registro anterior</p>
                </div>
              )}
            </div>
          )}

          {mostrarFormPeso && (
            <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Peso (kg)</label>
                  <input
                    type="number"
                    value={peso}
                    onChange={e => setPeso(e.target.value)}
                    placeholder="Ej: 65.5"
                    step="0.1"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Fecha</label>
                  <input
                    type="date"
                    value={fechaPeso}
                    onChange={e => setFechaPeso(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB]"
                  />
                </div>
              </div>
              {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setMostrarFormPeso(false)} className="px-3 py-1.5 text-sm text-[#8C97B5] hover:bg-white/5 rounded-lg">Cancelar</button>
                <button onClick={agregarPeso} className="px-3 py-1.5 text-sm bg-[#00E5C7] text-[#04342C] font-medium rounded-lg hover:bg-[#00E5C7]/80">Guardar</button>
              </div>
            </div>
          )}

          <div className="bg-[#131B2E] rounded-xl border border-[#1E293B]">
            <div className="p-4 border-b border-[#1E293B]">
              <h3 className="font-semibold text-[#F4F6FB] text-sm">Historial</h3>
            </div>
            {loading ? (
              <p className="p-4 text-[#8C97B5] text-sm">Cargando...</p>
            ) : pesos.length === 0 ? (
              <p className="p-4 text-[#8C97B5] text-sm">No hay registros de peso aún.</p>
            ) : (
              <ul className="divide-y divide-[#1E293B]">
                {pesos.map((p, i) => {
                  const anterior = pesos[i + 1]?.peso
                  const diff = anterior ? (p.peso - anterior).toFixed(1) : null
                  return (
                    <li key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#F4F6FB]">{p.peso} kg</p>
                        <p className="text-xs text-[#8C97B5]">{p.fecha}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {diff && (
                          <span className={`text-xs font-medium ${parseFloat(diff) <= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                            {parseFloat(diff) > 0 ? '+' : ''}{diff} kg
                          </span>
                        )}
                        <button onClick={() => eliminarPeso(p.id)} className="text-[#8C97B5]/40 hover:text-red-400 text-xs">✕</button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}