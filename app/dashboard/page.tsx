'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardPage() {
  const [userName, setUserName] = useState('')
  const [ultimoGasto, setUltimoGasto] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [promedioGeneral, setPromedioGeneral] = useState<number | null>(null)
  const [ultimoEntrenamiento, setUltimoEntrenamiento] = useState<any>(null)
  const [totalEntrenamientos, setTotalEntrenamientos] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    cargarResumen()
  }, [])

  const cargarResumen = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Perfil
    const { data: perfil } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    if (perfil) setUserName(perfil.full_name?.split(' ')[0] || '')

    // Finanzas
    const { data: transacciones } = await supabase
      .from('transacciones')
      .select('*')
      .order('fecha', { ascending: false })

    if (transacciones) {
      const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0)
      const gastos = transacciones.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0)
      setBalance(ingresos - gastos)
      setUltimoGasto(transacciones.find(t => t.tipo === 'gasto') || null)
    }

    // Académico
    const { data: notas } = await supabase.from('notas').select('nota, porcentaje')
    if (notas && notas.length > 0) {
      const promedio = notas.reduce((s, n) => s + n.nota, 0) / notas.length
      setPromedioGeneral(parseFloat(promedio.toFixed(1)))
    }

    // Deporte
    const { data: entrenos } = await supabase
      .from('entrenamientos')
      .select('*')
      .order('fecha', { ascending: false })
    if (entrenos) {
      setUltimoEntrenamiento(entrenos[0] || null)
      setTotalEntrenamientos(entrenos.length)
    }

    setLoading(false)
  }

  const formatMonto = (n: number) =>
    n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })

  const colorNota = (n: number) => {
    if (n >= 5.0) return 'text-green-600'
    if (n >= 4.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const deporteEmoji: Record<string, string> = {
    Boxeo: '🥊', Escalada: '🧗', Natación: '🏊', Trekking: '🥾',
    Ciclismo: '🚲', Fútbol: '⚽', Tenis: '🎾', Yoga: '🧘', Gym: '🏋️', Otro: '💪',
  }

  if (loading) return <p className="text-gray-400 text-sm">Cargando...</p>

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Hola{userName ? `, ${userName}` : ''} 👋
        </h2>
        <p className="text-gray-500 mt-1">Aquí está tu resumen de hoy</p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-6">

        {/* Finanzas */}
        <Link href="/dashboard/finanzas" className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl">💸</span>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Finanzas</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Balance del mes</p>
            <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMonto(balance)}
            </p>
          </div>
          {ultimoGasto && (
            <div className="pt-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">Último gasto</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {ultimoGasto.categoria} — {formatMonto(ultimoGasto.monto)}
              </p>
            </div>
          )}
        </Link>

        {/* Académico */}
        <Link href="/dashboard/academico" className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl">🎓</span>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Académico</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Promedio general</p>
            {promedioGeneral ? (
              <p className={`text-2xl font-bold mt-1 ${colorNota(promedioGeneral)}`}>
                {promedioGeneral}
              </p>
            ) : (
              <p className="text-2xl font-bold mt-1 text-gray-300">—</p>
            )}
          </div>
          <div className="pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              {promedioGeneral
                ? promedioGeneral >= 5.0 ? '¡Vas muy bien! 🌟' : promedioGeneral >= 4.0 ? 'Puedes mejorar 💪' : 'Necesitas reforzar 📚'
                : 'Sin notas aún'}
            </p>
          </div>
        </Link>

        {/* Deporte */}
        <Link href="/dashboard/deporte" className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl">💪</span>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Deporte</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Entrenamientos totales</p>
            <p className="text-2xl font-bold mt-1 text-blue-600">{totalEntrenamientos}</p>
          </div>
          {ultimoEntrenamiento && (
            <div className="pt-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">Último entrenamiento</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {deporteEmoji[ultimoEntrenamiento.deporte] || '💪'} {ultimoEntrenamiento.deporte} — {ultimoEntrenamiento.duracion} min
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Actividad reciente</h3>
        <div className="space-y-3">
          {ultimoGasto && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-base">💸</span>
              <div>
                <p className="text-gray-700">Gasto en <span className="font-medium">{ultimoGasto.categoria}</span></p>
                <p className="text-xs text-gray-400">{ultimoGasto.fecha}</p>
              </div>
              <span className="ml-auto text-red-500 font-medium">-{formatMonto(ultimoGasto.monto)}</span>
            </div>
          )}
          {ultimoEntrenamiento && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-base">
                {deporteEmoji[ultimoEntrenamiento.deporte] || '💪'}
              </span>
              <div>
                <p className="text-gray-700">Entrenamiento de <span className="font-medium">{ultimoEntrenamiento.deporte}</span></p>
                <p className="text-xs text-gray-400">{ultimoEntrenamiento.fecha}</p>
              </div>
              <span className="ml-auto text-blue-500 font-medium">{ultimoEntrenamiento.duracion} min</span>
            </div>
          )}
          {!ultimoGasto && !ultimoEntrenamiento && (
            <p className="text-gray-400 text-sm">No hay actividad reciente. ¡Comienza registrando algo!</p>
          )}
        </div>
      </div>
    </div>
  )
}