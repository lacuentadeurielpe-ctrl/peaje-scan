import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import BoletaDetalle from '@/components/BoletaDetalle'

export default async function BolетaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('boletas_peaje')
    .select('*, choferes(nombre, placa_vehiculo)')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const { data: choferes } = await supabase
    .from('choferes').select('id, nombre, placa_vehiculo').eq('activo', true).order('nombre')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Detalle de Boleta</h1>
        <p className="text-sm text-gray-500 mt-1">Edita, verifica o rechaza la boleta</p>
      </div>
      <BoletaDetalle boleta={data} choferes={choferes ?? []} />
    </div>
  )
}
