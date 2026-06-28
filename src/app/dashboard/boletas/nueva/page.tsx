import BolетaScanner from '@/components/BoletaScanner'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function NuevaBolетaPage() {
  const supabase = createAdminClient()
  const { data: choferes } = await supabase
    .from('choferes')
    .select('id, nombre, placa_vehiculo')
    .eq('activo', true)
    .order('nombre')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Boleta</h1>
        <p className="text-sm text-gray-500 mt-1">Sube la foto de la boleta de peaje y la IA extraerá los datos</p>
      </div>
      <BolетaScanner choferes={choferes ?? []} />
    </div>
  )
}
