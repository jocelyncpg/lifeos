'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const menuItems = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠', exact: true },
  { href: '/dashboard/finanzas', label: 'Finanzas', icon: '💸' },
  { href: '/dashboard/academico', label: 'Académico', icon: '🎓' },
  { href: '/dashboard/deporte', label: 'Deporte', icon: '💪' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F1A]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#131B2E] flex flex-col border-r border-[#1E293B]">
        <div className="p-6 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#00E5C7] flex items-center justify-center text-[#04342C] font-semibold text-sm">L</div>
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

      {/* Contenido principal */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}