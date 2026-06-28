import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperadmin } from '@/lib/auth'

export async function GET() {
  if (!(await requireSuperadmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('rol', 'chofer')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!(await requireSuperadmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { email, password, nombre, dni, placa_vehiculo, licencia, telefono } = await req.json()
  if (!email || !password || !nombre) {
    return NextResponse.json({ error: 'Email, contraseña y nombre son requeridos' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Crear cuenta de acceso
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

  // 2. Crear perfil de chofer
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .insert({
      id: userData.user.id,
      rol: 'chofer',
      nombre,
      dni: dni || null,
      placa_vehiculo: placa_vehiculo || null,
      licencia: licencia || null,
      telefono: telefono || null,
    })
    .select()
    .single()

  if (perfilError) {
    // rollback de la cuenta si falla el perfil
    await supabase.auth.admin.deleteUser(userData.user.id)
    return NextResponse.json({ error: perfilError.message }, { status: 500 })
  }

  return NextResponse.json(perfil)
}
