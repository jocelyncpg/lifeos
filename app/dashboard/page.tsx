'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { generarInsights, Insight } from '@/lib/insights'

export default function DashboardPage() {
  const [userName, setUserName] = useState('')
  const [ultimoGasto, setUltimoGasto] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [promedioGeneral, setPromedioGeneral] = useState<number | null>(null)
  const [ultimoEntrenamiento, setUltimoEntrenamiento] = useState<any>(null)
  const [totalEntrenamientos, setTotalEntrenamientos] = useState(0)
  const [insights, setInsights] = useState<Insight[]>([])
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
    const { data: notas } = await supabase.from('notas').select('nota, porcentaje, fecha')
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

    // Insights con IA basada en reglas
    const insightsGenerados = generarInsights(
      transacciones || [],
      notas || [],
      entrenos || []
    )
    setInsights(insightsGenerados)

    setLoading(false)
  }

  const formatMonto = (n: number) =>
    n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })

  const colorNota = (n: number) => {
    if (n >= 5.0) return 'text-green-400'
    if (n >= 4.0) return 'text-yellow-400'
    return 'text-red-400'
  }

  const deporteEmoji: Record<string, string> = {
    Boxeo: '🥊', Escalada: '🧗', Natación: '🏊', Trekking: '🥾',
    Ciclismo: '🚲', Fútbol: '⚽', Tenis: '🎾', Yoga: '🧘', Gym: '🏋️', Otro: '💪',
  }

  const insightStyle = (tipo: Insight['tipo']) => {
    if (tipo === 'positivo') return { box: 'bg-green-500/10 border-green-500/20', text: 'text-green-400' }
    if (tipo === 'alerta') return { box: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400' }
    return { box: 'bg-[#7C5CFC]/10 border-[#7C5CFC]/20', text: 'text-[#7C5CFC]' }
  }

  if (loading) return <p className="text-[#8C97B5] text-sm">Cargando...</p>

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div>
        <h2 className="text-3xl font-bold text-[#F4F6FB]">
          Hola{userName ? `, ${userName}` : ''} 👋
        </h2>
        <p className="text-[#8C97B5] mt-1">Aquí está tu resumen de hoy</p>
      </div>

      {/* Insights inteligentes */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#8C97B5] uppercase tracking-wide">🧠 Recomendaciones para ti</h3>
        {insights.map((insight, i) => {
          const style = insightStyle(insight.tipo)
          return (
            <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${style.box}`}>
              <span className="text-2xl">{insight.emoji}</span>
              <p className={`text-sm ${style.text}`}>{insight.mensaje}</p>
            </div>
          )
        })}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-6">

        {/* Finanzas */}
        <Link href="/dashboard/finanzas" className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-6 hover:border-[#00E5C7]/40 transition-colors space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl">💸</span>
            <span className="text-xs text-[#8C97B5] uppercase tracking-wide">Finanzas</span>
          </div>
          <div>
            <p className="text-sm text-[#8C97B5]">Balance del mes</p>
            <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatMonto(balance)}
            </p>
          </div>
          {ultimoGasto && (
            <div className="pt-3 border-t border-[#1E293B]">
              <p className="text-xs text-[#8C97B5]">Último gasto</p>
              <p className="text-sm text-[#F4F6FB] mt-0.5">
                {ultimoGasto.categoria} — {formatMonto(ultimoGasto.monto)}
              </p>
            </div>
          )}
        </Link>

        {/* Académico */}
        <Link href="/dashboard/academico" className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-6 hover:border-[#00E5C7]/40 transition-colors space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl">🎓</span>
            <span className="text-xs text-[#8C97B5] uppercase tracking-wide">Académico</span>
          </div>
          <div>
            <p className="text-sm text-[#8C97B5]">Promedio general</p>
            {promedioGeneral ? (
              <p className={`text-2xl font-bold mt-1 ${colorNota(promedioGeneral)}`}>
                {promedioGeneral}
              </p>
            ) : (
              <p className="text-2xl font-bold mt-1 text-[#8C97B5]/40">—</p>
            )}
          </div>
          <div className="pt-3 border-t border-[#1E293B]">
            <p className="text-xs text-[#8C97B5]">
              {promedioGeneral
                ? promedioGeneral >= 5.0 ? '¡Vas muy bien! 🌟' : promedioGeneral >= 4.0 ? 'Puedes mejorar 💪' : 'Necesitas reforzar 📚'
                : 'Sin notas aún'}
            </p>
          </div>
        </Link>

        {/* Deporte */}
        <Link href="/dashboard/deporte" className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-6 hover:border-[#00E5C7]/40 transition-colors space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl">💪</span>
            <span className="text-xs text-[#8C97B5] uppercase tracking-wide">Deporte</span>
          </div>
          <div>
            <p className="text-sm text-[#8C97B5]">Entrenamientos totales</p>
            <p className="text-2xl font-bold mt-1 text-[#00E5C7]">{totalEntrenamientos}</p>
          </div>
          {ultimoEntrenamiento && (
            <div className="pt-3 border-t border-[#1E293B]">
              <p className="text-xs text-[#8C97B5]">Último entrenamiento</p>
              <p className="text-sm text-[#F4F6FB] mt-0.5">
                {deporteEmoji[ultimoEntrenamiento.deporte] || '💪'} {ultimoEntrenamiento.deporte} — {ultimoEntrenamiento.duracion} min
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Actividad reciente */}
      <div className="bg-[#131B2E] rounded-xl border border-[#1E293B] p-6">
        <h3 className="font-semibold text-[#F4F6FB] mb-4">Actividad reciente</h3>
        <div className="space-y-3">
          {ultimoGasto && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center text-base">💸</span>
              <div>
                <p className="text-[#F4F6FB]">Gasto en <span className="font-medium">{ultimoGasto.categoria}</span></p>
                <p className="text-xs text-[#8C97B5]">{ultimoGasto.fecha}</p>
              </div>
              <span className="ml-auto text-red-400 font-medium">-{formatMonto(ultimoGasto.monto)}</span>
            </div>
          )}
          {ultimoEntrenamiento && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-8 h-8 bg-[#00E5C7]/10 rounded-full flex items-center justify-center text-base">
                {deporteEmoji[ultimoEntrenamiento.deporte] || '💪'}
              </span>
              <div>
                <p className="text-[#F4F6FB]">Entrenamiento de <span className="font-medium">{ultimoEntrenamiento.deporte}</span></p>
                <p className="text-xs text-[#8C97B5]">{ultimoEntrenamiento.fecha}</p>
              </div>
              <span className="ml-auto text-[#00E5C7] font-medium">{ultimoEntrenamiento.duracion} min</span>
            </div>
          )}
          {!ultimoGasto && !ultimoEntrenamiento && (
            <p className="text-[#8C97B5] text-sm">No hay actividad reciente. ¡Comienza registrando algo!</p>
          )}
        </div>
      </div>
    </div>
  )
}