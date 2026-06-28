import { createAdminClient } from '@/lib/supabase/admin'
import BolетasList from '@/components/BolетasList'

export default async function BoletasPage() {
  const supabase = createAdminClient()
  const [{ data: boletas }, { data: choferes }] = await Promise.all([
    supabase
      .from('boletas_peaje')
      .select('*, choferes(nombre, placa_vehiculo)')
      .order('created_at', { ascending: false }),
    supabase.from('choferes').select('id, nombre').eq('activo', true).order('nombre'),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Boletas de Peaje</h1>
        <p className="text-sm text-gray-500 mt-1">Historial de boletas digitalizadas</p>
      </div>
      <BolетasList initialBoletas={boletas ?? []} choferes={choferes ?? []} />
    </div>
  )
}
