import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import BoletaEditor from '@/components/BoletaEditor'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('boletas_peaje').select('*, perfiles(nombre)').eq('id', id).single()
  if (!data) notFound()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Boleta de {data.perfiles?.nombre ?? '—'}</h1>
      <p className="text-sm text-gray-500 mb-6">Revisa, verifica, rechaza o elimina</p>
      <BoletaEditor boleta={data} rol="superadmin" />
    </div>
  )
}
