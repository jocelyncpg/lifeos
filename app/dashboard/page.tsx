export default function DashboardPage() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Bienvenida 👋</h2>
          <p className="text-gray-500 mt-1">¿Qué quieres gestionar hoy?</p>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/dashboard/finanzas" className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="text-4xl mb-3">💸</div>
            <h3 className="text-lg font-semibold text-gray-800">Finanzas</h3>
            <p className="text-sm text-gray-500 mt-1">Controla tus gastos e ingresos</p>
          </a>
  
          <a href="/dashboard/academico" className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="text-4xl mb-3">🎓</div>
            <h3 className="text-lg font-semibold text-gray-800">Académico</h3>
            <p className="text-sm text-gray-500 mt-1">Gestiona ramos y notas</p>
          </a>
  
          <a href="/dashboard/deporte" className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="text-4xl mb-3">💪</div>
            <h3 className="text-lg font-semibold text-gray-800">Deporte</h3>
            <p className="text-sm text-gray-500 mt-1">Registra tus entrenamientos</p>
          </a>
        </div>
      </div>
    )
  }