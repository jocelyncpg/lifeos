'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Medicamento = {
  id: string
  nombre: string
  dosis: string
  frecuencia: string
  horarios: string
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
}

type CitaMedica = {
  id: string
  especialidad: string
  doctor: string
  lugar: string
  fecha: string
  hora: string | null
  notas: string
  completada: boolean
}

export default function SaludPage() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [citas, setCitas] = useState<CitaMedica[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [mostrarFormMed, setMostrarFormMed] = useState(false)
  const [nombreMed, setNombreMed] = useState('')
  const [dosis, setDosis] = useState('')
  const [frecuencia, setFrecuencia] = useState('')
  const [horarios, setHorarios] = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState('')

  const [mostrarFormCita, setMostrarFormCita] = useState(false)
  const [especialidad, setEspecialidad] = useState('')
  const [doctor, setDoctor] = useState('')
  const [lugar, setLugar] = useState('')
  const [fechaCita, setFechaCita] = useState(new Date().toISOString().split('T')[0])
  const [horaCita, setHoraCita] = useState('')
  const [notas, setNotas] = useState('')

  const supabase = createClient()

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const { data: meds } = await supabase
      .from('medicamentos')
      .select('*')
      .order('created_at', { ascending: false })
    if (meds) setMedicamentos(meds)

    const { data: citasData } = await supabase
      .from('citas_medicas')
      .select('*')
      .order('fecha', { ascending: true })
    if (citasData) setCitas(citasData)

    setLoading(false)
  }

  const agregarMedicamento = async () => {
    setErrorMsg('')
    if (!nombreMed) { setErrorMsg('El nombre es obligatorio.'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErrorMsg('No hay sesión activa.'); return }

    const { error } = await supabase.from('medicamentos').insert({
      user_id: user.id,
      nombre: nombreMed,
      dosis,
      frecuencia,
      horarios,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || null,
    })

    if (error) { setErrorMsg('Error: ' + error.message); return }

    setNombreMed('')
    setDosis('')
    setFrecuencia('')
    setHorarios('')
    setFechaFin('')
    setMostrarFormMed(false)
    cargarDatos()
  }

  const toggleActivoMed = async (id: string, actual: boolean) => {
    await supabase.from('medicamentos').update({ activo: !actual }).eq('id', id)
    cargarDatos()
  }

  const eliminarMedicamento = async (id: string) => {
    await supabase.from('medicamentos').delete().eq('id', id)
    cargarDatos()
  }

  const agregarCita = async () => {
    setErrorMsg('')
    if (!especialidad) { setErrorMsg('La especialidad es obligatoria.'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErrorMsg('No hay sesión activa.'); return }

    const { error } = await supabase.from('citas_medicas').insert({
      user_id: user.id,
      especialidad,
      doctor,
      lugar,
      fecha: fechaCita,
      hora: horaCita || null,
      notas,
    })

    if (error) { setErrorMsg('Error: ' + error.message); return }

    setEspecialidad('')
    setDoctor('')
    setLugar('')
    setHoraCita('')
    setNotas('')
    setMostrarFormCita(false)
    cargarDatos()
  }

  const toggleCompletadaCita = async (id: string, actual: boolean) => {
    await supabase.from('citas_medicas').update({ completada: !actual }).eq('id', id)
    cargarDatos()
  }

  const eliminarCita = async (id: string) => {
    await supabase.from('citas_medicas').delete().eq('id', id)
    cargarDatos()
  }

  const medicamentosActivos = medicamentos.filter(m => m.activo)
  const medicamentosInactivos = medicamentos.filter(m => !m.activo)

  const hoy = new Date().toISOString().split('T')[0]
  const citasProximas = citas.filter(c => !c.completada && c.fecha >= hoy)
  const citasPasadas = citas.filter(c => c.completada || c.fecha < hoy)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#F4F6FB]">💊 Salud</h2>
        <p className="text-[#8C97B5] text-sm mt-1">Medicamentos y citas médicas</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Medicamentos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#F4F6FB]">Medicamentos</h3>
            <button
              onClick={() => setMostrarFormMed(!mostrarFormMed)}
              className="bg-[#00E5C7] text-[#04342C] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#00E5C7]/80"
            >
              + Nuevo
            </button>
          </div>

          {mostrarFormMed && (
            <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-[#8C97B5]">Nombre</label>
                  <input
                    type="text"
                    value={nombreMed}
                    onChange={e => setNombreMed(e.target.value)}
                    placeholder="Ej: Ibuprofeno"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Dosis</label>
                  <input
                    type="text"
                    value={dosis}
                    onChange={e => setDosis(e.target.value)}
                    placeholder="Ej: 400mg"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Frecuencia</label>
                  <input
                    type="text"
                    value={frecuencia}
                    onChange={e => setFrecuencia(e.target.value)}
                    placeholder="Ej: Cada 8 horas"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-[#8C97B5]">Horarios</label>
                  <input
                    type="text"
                    value={horarios}
                    onChange={e => setHorarios(e.target.value)}
                    placeholder="Ej: 08:00, 16:00, 00:00"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Fecha inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={e => setFechaInicio(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Fecha fin (opcional)</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={e => setFechaFin(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB]"
                  />
                </div>
              </div>
              {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setMostrarFormMed(false)} className="px-3 py-1.5 text-sm text-[#8C97B5] hover:bg-white/5 rounded-lg">Cancelar</button>
                <button onClick={agregarMedicamento} className="px-3 py-1.5 text-sm bg-[#00E5C7] text-[#04342C] font-medium rounded-lg hover:bg-[#00E5C7]/80">Guardar</button>
              </div>
            </div>
          )}

          <div className="bg-[#131B2E] rounded-xl border border-[#1E293B]">
            {loading ? (
              <p className="p-4 text-[#8C97B5] text-sm">Cargando...</p>
            ) : medicamentosActivos.length === 0 ? (
              <p className="p-4 text-[#8C97B5] text-sm">No tienes medicamentos activos.</p>
            ) : (
              <ul className="divide-y divide-[#1E293B]">
                {medicamentosActivos.map(m => (
                  <li key={m.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-[#F4F6FB] text-sm">{m.nombre} {m.dosis && `· ${m.dosis}`}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActivoMed(m.id, m.activo)} className="text-xs text-[#8C97B5] hover:text-[#00E5C7]">Pausar</button>
                        <button onClick={() => eliminarMedicamento(m.id)} className="text-[#8C97B5]/40 hover:text-red-400 text-xs">✕</button>
                      </div>
                    </div>
                    {m.frecuencia && <p className="text-xs text-[#8C97B5]">{m.frecuencia}</p>}
                    {m.horarios && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {m.horarios.split(',').map((h, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#7C5CFC]/10 text-[#7C5CFC]">{h.trim()}</span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {medicamentosInactivos.length > 0 && (
              <div className="p-4 border-t border-[#1E293B]">
                <p className="text-xs text-[#8C97B5] mb-2">Pausados</p>
                <div className="space-y-1">
                  {medicamentosInactivos.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <span className="text-[#8C97B5]">{m.nombre}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActivoMed(m.id, m.activo)} className="text-[#00E5C7] hover:underline">Reactivar</button>
                        <button onClick={() => eliminarMedicamento(m.id)} className="text-[#8C97B5]/40 hover:text-red-400">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Citas médicas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#F4F6FB]">Citas médicas</h3>
            <button
              onClick={() => setMostrarFormCita(!mostrarFormCita)}
              className="bg-[#00E5C7] text-[#04342C] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#00E5C7]/80"
            >
              + Nueva
            </button>
          </div>

          {mostrarFormCita && (
            <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Especialidad</label>
                  <input
                    type="text"
                    value={especialidad}
                    onChange={e => setEspecialidad(e.target.value)}
                    placeholder="Ej: Dentista"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Doctor/a</label>
                  <input
                    type="text"
                    value={doctor}
                    onChange={e => setDoctor(e.target.value)}
                    placeholder="Opcional"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-[#8C97B5]">Lugar</label>
                  <input
                    type="text"
                    value={lugar}
                    onChange={e => setLugar(e.target.value)}
                    placeholder="Opcional"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Fecha</label>
                  <input
                    type="date"
                    value={fechaCita}
                    onChange={e => setFechaCita(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8C97B5]">Hora</label>
                  <input
                    type="time"
                    value={horaCita}
                    onChange={e => setHoraCita(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-[#8C97B5]">Notas</label>
                  <input
                    type="text"
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    placeholder="Opcional"
                    className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
                  />
                </div>
              </div>
              {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setMostrarFormCita(false)} className="px-3 py-1.5 text-sm text-[#8C97B5] hover:bg-white/5 rounded-lg">Cancelar</button>
                <button onClick={agregarCita} className="px-3 py-1.5 text-sm bg-[#00E5C7] text-[#04342C] font-medium rounded-lg hover:bg-[#00E5C7]/80">Guardar</button>
              </div>
            </div>
          )}

          <div className="bg-[#131B2E] rounded-xl border border-[#1E293B]">
            {loading ? (
              <p className="p-4 text-[#8C97B5] text-sm">Cargando...</p>
            ) : citasProximas.length === 0 ? (
              <p className="p-4 text-[#8C97B5] text-sm">No tienes citas próximas.</p>
            ) : (
              <ul className="divide-y divide-[#1E293B]">
                {citasProximas.map(c => (
                  <li key={c.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-[#F4F6FB] text-sm">{c.especialidad}{c.doctor && ` · ${c.doctor}`}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleCompletadaCita(c.id, c.completada)} className="text-xs text-[#8C97B5] hover:text-[#00E5C7]">✓</button>
                        <button onClick={() => eliminarCita(c.id)} className="text-[#8C97B5]/40 hover:text-red-400 text-xs">✕</button>
                      </div>
                    </div>
                    <p className="text-xs text-[#8C97B5] mt-0.5">
                      {c.fecha}{c.hora && ` · ${c.hora.slice(0,5)}`}{c.lugar && ` · ${c.lugar}`}
                    </p>
                    {c.notas && <p className="text-xs text-[#8C97B5] mt-0.5">{c.notas}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {citasPasadas.length > 0 && (
            <details className="text-sm">
              <summary className="text-[#8C97B5] cursor-pointer">Historial ({citasPasadas.length})</summary>
              <ul className="mt-2 space-y-1">
                {citasPasadas.map(c => (
                  <li key={c.id} className="flex items-center justify-between text-xs text-[#8C97B5] py-1">
                    <span className={c.completada ? 'line-through opacity-60' : ''}>{c.especialidad} · {c.fecha}</span>
                    <button onClick={() => eliminarCita(c.id)} className="hover:text-red-400">✕</button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}