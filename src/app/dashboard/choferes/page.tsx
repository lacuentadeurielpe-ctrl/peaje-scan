import { createClient } from '@/lib/supabase/server'
import ChoferesList from '@/components/ChoferesList'

export default async function ChoforesPage() {
  const supabase = await createClient()
  const { data: choferes } = await supabase
    .from('choferes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Choferes</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona los choferes del sistema</p>
      </div>
      <ChoferesList initialChoferes={choferes ?? []} />
    </div>
  )
}
