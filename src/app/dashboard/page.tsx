import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Truck, CheckCircle, Clock, Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ count: totalBoletas }, { count: pendientes }, { count: verificadas }, { count: choferes }] =
    await Promise.all([
      supabase.from('boletas_peaje').select('*', { count: 'exact', head: true }),
      supabase.from('boletas_peaje').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('boletas_peaje').select('*', { count: 'exact', head: true }).eq('estado', 'verificado'),
      supabase.from('choferes').select('*', { count: 'exact', head: true }).eq('activo', true),
    ])

  const stats = [
    { label: 'Total Boletas', value: totalBoletas ?? 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pendientes', value: pendientes ?? 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Verificadas', value: verificadas ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Choferes Activos', value: choferes ?? 0, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel General</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen de boletas de peaje digitalizadas</p>
        </div>
        <Link
          href="/dashboard/boletas/nueva"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Nueva Boleta
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={color} size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/boletas/nueva"
          className="bg-white rounded-xl border-2 border-dashed border-blue-300 p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <Plus className="text-blue-600" size={24} />
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">Digitalizar Boleta</div>
            <div className="text-sm text-gray-500">Sube una foto y la IA extrae los datos</div>
          </div>
        </Link>
        <Link
          href="/dashboard/boletas"
          className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center gap-3 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="text-gray-600" size={24} />
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">Ver Todas las Boletas</div>
            <div className="text-sm text-gray-500">Filtra, edita y exporta</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
