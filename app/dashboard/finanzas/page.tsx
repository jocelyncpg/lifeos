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

  const coloresCategorias = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6']

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">💸 Finanzas</h2>
          <p className="text-gray-500 text-sm mt-1">Controla tus ingresos y gastos</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Nueva transacción
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-sm text-green-600 font-medium">Ingresos</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatMonto(totalIngresos)}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-sm text-red-600 font-medium">Gastos</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{formatMonto(totalGastos)}</p>
        </div>
        <div className={`rounded-xl p-4 border ${balance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className={`text-sm font-medium ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Balance</p>
          <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatMonto(balance)}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Gastos por categoría</h3>
          {gastosPorCategoria.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay gastos registrados aún.</p>
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
                  label={(props: any) => `${props.categoria} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {gastosPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatMonto(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataMensual}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(value: any) => formatMonto(Number(value))} />
              <Legend />
              <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Nueva transacción</h3>

          <div className="flex gap-2">
            <button
              onClick={() => { setTipo('gasto'); setCategoria('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${tipo === 'gasto' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Gasto
            </button>
            <button
              onClick={() => { setTipo('ingreso'); setCategoria('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${tipo === 'ingreso' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Ingreso
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Categoría</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Selecciona...</option>
                {categorias[tipo].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Monto (CLP)</label>
              <input
                type="number"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder="0"
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Opcional"
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

          {errorMsg && (
            <p className="text-red-500 text-sm">{errorMsg}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={agregarTransaccion}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Lista de transacciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Transacciones</h3>
        </div>
        {loading ? (
          <p className="p-4 text-gray-400 text-sm">Cargando...</p>
        ) : transacciones.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">No hay transacciones aún.</p>
        ) : (
          <ul className="divide-y">
            {transacciones.map(t => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{t.tipo === 'ingreso' ? '🟢' : '🔴'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.categoria}</p>
                    <p className="text-xs text-gray-400">{t.descripcion || '—'} · {t.fecha}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.tipo === 'ingreso' ? '+' : '-'}{formatMonto(t.monto)}
                  </span>
                  <button
                    onClick={() => eliminarTransaccion(t.id)}
                    className="text-gray-300 hover:text-red-400 text-xs"
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