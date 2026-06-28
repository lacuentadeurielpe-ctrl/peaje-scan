import { redirect } from 'next/navigation'
import { getPerfil } from '@/lib/auth'

export default async function Home() {
  const perfil = await getPerfil()
  if (!perfil) redirect('/login')
  if (perfil.rol === 'superadmin') redirect('/dashboard')
  redirect('/portal')
}
