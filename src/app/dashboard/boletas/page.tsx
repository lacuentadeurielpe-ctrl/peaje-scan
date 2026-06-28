import { createAdminClient } from '@/lib/supabase/admin'
import BoletasGlobal from '@/components/BoletasGlobal'

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const supabase = createAdminClient()
  const [{ data: boletas }, { data: choferes }] = await Promise.all([
    supabase.from('boletas_peaje')
      .select('*, perfiles(nombre, placa_vehiculo), adelantos(n_adelanto, ruta, bus)')
      .order('created_at', { ascending: false }),
    supabase.from('perfiles').select('id, nombre').eq('rol', 'chofer').order('nombre'),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Todas las Boletas</h1>
        <p className="text-sm text-gray-500 mt-1">Vista global de todas las boletas de todos los choferes</p>
      </div>
      <BoletasGlobal initialBoletas={boletas ?? []} choferes={choferes ?? []} soloError={error === '1'} />
    </div>
  )
}
