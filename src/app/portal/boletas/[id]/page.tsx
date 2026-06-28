import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { requireChofer } from '@/lib/auth'
import BoletaEditor from '@/components/BoletaEditor'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const perfil = await requireChofer()
  if (!perfil) redirect('/login')

  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('boletas_peaje').select('*, perfiles(nombre)').eq('id', id).single()
  if (!data) notFound()
  if (data.chofer_id !== perfil.id) redirect('/portal')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mi boleta</h1>
      <p className="text-sm text-gray-500 mb-6">Corrige los datos o márcala con error si algo está mal</p>
      <BoletaEditor boleta={data} rol="chofer" />
    </div>
  )
}
