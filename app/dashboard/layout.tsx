'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const menuItems = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠', exact: true },
  { href: '/dashboard/finanzas', label: 'Finanzas', icon: '💸' },
  { href: '/dashboard/academico', label: 'Académico', icon: '🎓' },
  { href: '/dashboard/deporte', label: 'Deporte', icon: '💪' },
  { href: '/dashboard/calendario', label: 'Calendario', icon: '🗓️' },
  { href: '/dashboard/salud', label: 'Salud', icon: '💊' },
  { href: '/dashboard/nutricion', label: 'Nutrición', icon: '🍽️' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F1A]">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 bg-[#131B2E] flex-col border-r border-[#1E293B]">
        <div className="p-6 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="LifeOS" className="w-12 h-12 rounded-md" />
            <h1 className="text-xl font-semibold text-[#F4F6FB]">LifeOS</h1>
          </div>
          <p className="text-xs text-[#8C97B5] mt-1">Tu copiloto de vida</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#00E5C7]/10 text-[#00E5C7]'
                    : 'text-[#8C97B5] hover:bg-white/5 hover:text-[#F4F6FB]'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#1E293B]">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-[#8C97B5] hover:bg-white/5 hover:text-red-400 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido + navbar móvil */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Navbar móvil */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#131B2E] border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="LifeOS" className="w-8 h-8 rounded-md" />
            <span className="text-[#F4F6FB] font-semibold">LifeOS</span>
          </div>
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="text-[#8C97B5] text-2xl px-2"
          >
            {menuAbierto ? '✕' : '☰'}
          </button>
        </header>

        {/* Menú móvil desplegable */}
        {menuAbierto && (
          <div className="md:hidden bg-[#131B2E] border-b border-[#1E293B] px-4 py-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuAbierto(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#00E5C7]/10 text-[#00E5C7]'
                      : 'text-[#8C97B5] hover:bg-white/5 hover:text-[#F4F6FB]'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-sm text-left text-red-400 hover:bg-white/5 rounded-lg"
            >
              Cerrar sesión
            </button>
          </div>
        )}

        {/* Contenido principal */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}