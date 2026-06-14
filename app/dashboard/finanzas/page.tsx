'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

type Transaccion = {
  id: string
  tipo: 'ingreso' | 'gasto'
  categoria: string
  descripcion: string
  monto: number
  fecha: string
}

const categorias = {
  ingreso: ['Sueldo', 'Freelance', 'Beca', 'Otro'],
  gasto: ['Alimentación', 'Transporte', 'Educación', 'Salud', 'Entretenimiento', 'Ropa', 'Otro'],
}

export default function FinanzasPage() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('gasto')
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  useEffect(() => {
    cargarTransacciones()
  }, [])

  const cargarTransacciones = async () => {
    const { data } = await supabase
      .from('transacciones')
      .select('*')
      .order('fecha', { ascending: false })
    if (data) setTransacciones(data)
    setLoading(false)
  }

  const agregarTransaccion = async () => {
    setErrorMsg('')

    if (!monto || !categoria) {
      setErrorMsg('Por favor completa categoría y monto.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setErrorMsg('No hay sesión activa. Inicia sesión primero.')
      return
    }

    const { error } = await supabase.from('transacciones').insert({
      user_id: user.id,
      tipo,
      categoria,
      descripcion,
      monto: parseFloat(monto),
      fecha,
    })

    if (error) {
      setErrorMsg('Error al guardar: ' + error.message)
      return
    }

    setMostrarForm(false)
    setMonto('')
    setDescripcion('')
    setCategoria('')
    cargarTransacciones()
  }

  const eliminarTransaccion = async (id: string) => {
    await supabase.from('transacciones').delete().eq('id', id)
    cargarTransacciones()
  }

  const totalIngresos = transacciones
    .filter(t => t.tipo === 'ingreso')
    .reduce((sum, t) => sum + t.monto, 0)

  const totalGastos = transacciones
    .filter(t => t.tipo === 'gasto')
    .reduce((sum, t) => sum + t.monto, 0)

  const balance = totalIngresos - totalGastos

  const formatMonto = (n: number) =>
    n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })

  const coloresCategorias = ['#00E5C7', '#7C5CFC', '#F59E0B', '#F87171', '#3B82F6', '#EC4899', '#A3E635', '#14B8A6']

  const gastosPorCategoria = Object.entries(
    transacciones
      .filter(t => t.tipo === 'gasto')
      .reduce((acc: Record<string, number>, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.monto
        return acc
      }, {})
  ).map(([categoria, monto], i) => ({
    categoria,
    monto,
    color: coloresCategorias[i % coloresCategorias.length],
  }))

  // Últimos 6 meses para gráfico de barras
  const ultimosMeses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return { mes: d.toLocaleDateString('es-CL', { month: 'short' }), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
  })

  const dataMensual = ultimosMeses.map(({ mes, key }) => {
    const ingresos = transacciones
      .filter(t => t.tipo === 'ingreso' && t.fecha.startsWith(key))
      .reduce((s, t) => s + t.monto, 0)
    const gastos = transacciones
      .filter(t => t.tipo === 'gasto' && t.fecha.startsWith(key))
      .reduce((s, t) => s + t.monto, 0)
    return { mes, ingresos, gastos }
  })

  const tooltipStyle = {
    backgroundColor: '#131B2E',
    border: '1px solid #1E293B',
    borderRadius: '8px',
    color: '#F4F6FB',
    fontSize: '12px',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#F4F6FB]">💸 Finanzas</h2>
          <p className="text-[#8C97B5] text-sm mt-1">Controla tus ingresos y gastos</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-[#00E5C7] text-[#04342C] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00E5C7]/80"
        >
          + Nueva transacción
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-sm text-green-400 font-medium">Ingresos</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatMonto(totalIngresos)}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-sm text-red-400 font-medium">Gastos</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{formatMonto(totalGastos)}</p>
        </div>
        <div className={`rounded-xl p-4 border ${balance >= 0 ? 'bg-[#00E5C7]/10 border-[#00E5C7]/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
          <p className={`text-sm font-medium ${balance >= 0 ? 'text-[#00E5C7]' : 'text-orange-400'}`}>Balance</p>
          <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-[#00E5C7]' : 'text-orange-400'}`}>{formatMonto(balance)}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-6">
          <h3 className="font-semibold text-[#F4F6FB] mb-4">Gastos por categoría</h3>
          {gastosPorCategoria.length === 0 ? (
            <p className="text-[#8C97B5] text-sm">No hay gastos registrados aún.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={gastosPorCategoria}
                  dataKey="monto"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(props: any) => (
                    <text
                      x={props.x}
                      y={props.y}
                      fill="#8C97B5"
                      fontSize={12}
                      textAnchor={props.x > props.cx ? 'start' : 'end'}
                      dominantBaseline="central"
                    >
                      {`${props.categoria} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                    </text>
                  )}
                >
                  {gastosPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatMonto(Number(value))} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-6">
          <h3 className="font-semibold text-[#F4F6FB] mb-4">Últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataMensual}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="mes" fontSize={12} stroke="#8C97B5" />
              <YAxis fontSize={12} stroke="#8C97B5" tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(value: any) => formatMonto(Number(value))} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#8C97B5' }} />
              <Bar dataKey="ingresos" fill="#00E5C7" name="Ingresos" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="#F87171" name="Gastos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-6 space-y-4">
          <h3 className="font-semibold text-[#F4F6FB]">Nueva transacción</h3>

          <div className="flex gap-2">
            <button
              onClick={() => { setTipo('gasto'); setCategoria('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${tipo === 'gasto' ? 'bg-red-500 text-white' : 'bg-[#1E293B] text-[#8C97B5]'}`}
            >
              Gasto
            </button>
            <button
              onClick={() => { setTipo('ingreso'); setCategoria('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${tipo === 'ingreso' ? 'bg-green-500 text-white' : 'bg-[#1E293B] text-[#8C97B5]'}`}
            >
              Ingreso
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#8C97B5]">Categoría</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB]"
              >
                <option value="">Selecciona...</option>
                {categorias[tipo].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#8C97B5]">Monto (CLP)</label>
              <input
                type="number"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder="0"
                className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#8C97B5]">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Opcional"
                className="w-full mt-1 px-3 py-2 bg-[#0B0F1A] border border-[#1E293B] rounded-lg text-sm text-[#F4F6FB] placeholder:text-[#8C97B5]/50"
              />
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
          </div>

          {errorMsg && (
            <p className="text-red-400 text-sm">{errorMsg}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 text-sm text-[#8C97B5] hover:bg-white/5 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={agregarTransaccion}
              className="px-4 py-2 text-sm bg-[#00E5C7] text-[#04342C] font-medium rounded-lg hover:bg-[#00E5C7]/80"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Lista de transacciones */}
      <div className="bg-[#131B2E] rounded-xl border border-[#1E293B]">
        <div className="p-4 border-b border-[#1E293B]">
          <h3 className="font-semibold text-[#F4F6FB]">Transacciones</h3>
        </div>
        {loading ? (
          <p className="p-4 text-[#8C97B5] text-sm">Cargando...</p>
        ) : transacciones.length === 0 ? (
          <p className="p-4 text-[#8C97B5] text-sm">No hay transacciones aún.</p>
        ) : (
          <ul className="divide-y divide-[#1E293B]">
            {transacciones.map(t => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{t.tipo === 'ingreso' ? '🟢' : '🔴'}</span>
                  <div>
                    <p className="text-sm font-medium text-[#F4F6FB]">{t.categoria}</p>
                    <p className="text-xs text-[#8C97B5]">{t.descripcion || '—'} · {t.fecha}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${t.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.tipo === 'ingreso' ? '+' : '-'}{formatMonto(t.monto)}
                  </span>
                  <button
                    onClick={() => eliminarTransaccion(t.id)}
                    className="text-[#8C97B5]/40 hover:text-red-400 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}