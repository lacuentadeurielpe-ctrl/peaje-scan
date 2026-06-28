import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface Perfil {
  id: string
  rol: 'superadmin' | 'chofer'
  nombre: string
  dni: string | null
  placa_vehiculo: string | null
  licencia: string | null
  telefono: string | null
  empresa: string | null
  activo: boolean
}

// Devuelve el perfil del usuario autenticado (o null si no hay sesión).
export async function getPerfil(): Promise<Perfil | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Usamos admin client para leer el perfil sin depender de RLS
  const admin = createAdminClient()
  const { data } = await admin.from('perfiles').select('*').eq('id', user.id).single()
  return (data as Perfil) ?? null
}

export async function requireSuperadmin(): Promise<Perfil | null> {
  const perfil = await getPerfil()
  if (!perfil || perfil.rol !== 'superadmin') return null
  return perfil
}

export async function requireChofer(): Promise<Perfil | null> {
  const perfil = await getPerfil()
  if (!perfil || perfil.rol !== 'chofer') return null
  return perfil
}
