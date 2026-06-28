import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperadmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperadmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const supabase = createAdminClient()

  // Cambio de contraseña
  if (body.password) {
    const { error } = await supabase.auth.admin.updateUserById(id, { password: body.password })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Actualización de datos del perfil
  const camposPerfil = ['nombre', 'dni', 'placa_vehiculo', 'licencia', 'telefono', 'activo']
  const updates: Record<string, unknown> = {}
  for (const c of camposPerfil) if (c in body) updates[c] = body[c]

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('perfiles').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperadmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const supabase = createAdminClient()
  // Borra la cuenta auth; el perfil cae en cascada (FK on delete cascade)
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
