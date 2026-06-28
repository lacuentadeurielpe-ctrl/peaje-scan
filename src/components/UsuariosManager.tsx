'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, KeyRound, Check, X, Loader2, ShieldCheck } from 'lucide-react'

interface Usuario {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
}

export default function UsuariosManager() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cambiandoPass, setCambiandoPass] = useState<string | null>(null)
  const [nuevaPass, setNuevaPass] = useState('')

  useEffect(() => { cargarUsuarios() }, [])

  async function cargarUsuarios() {
    setLoading(true)
    const res = await fetch('/api/usuarios')
    const data = await res.json()
    setUsuarios(data)
    setLoading(false)
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail || !newPassword) return
    setCreating(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
    } else {
      setSuccess(`Usuario ${data.email} creado correctamente`)
      setNewEmail('')
      setNewPassword('')
      setShowForm(false)
      await cargarUsuarios()
    }
    setCreating(false)
  }

  async function handleEliminar(id: string, email: string) {
    if (!confirm(`¿Eliminar al usuario ${email}? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsuarios(prev => prev.filter(u => u.id !== id))
      setSuccess(`Usuario ${email} eliminado`)
    }
  }

  async function handleCambiarPassword(id: string) {
    if (!nuevaPass || nuevaPass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: nuevaPass }),
    })
    if (res.ok) {
      setSuccess('Contraseña actualizada correctamente')
      setCambiandoPass(null)
      setNuevaPass('')
    } else {
      const d = await res.json()
      setError(d.error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Banner info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-blue-800">
          Solo tú (superadmin) puedes crear accesos. Los usuarios no pueden registrarse solos —
          tú defines su email y contraseña y se los compartes directamente.
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess('')}><X size={14} /></button>
        </div>
      )}

      {/* Formulario nuevo usuario */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-300 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Crear nuevo usuario</h3>
          <form onSubmit={handleCrear} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                placeholder="usuario@empresa.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewEmail(''); setNewPassword('') }}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {creating ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-sm text-gray-500">
            {loading ? 'Cargando...' : `${usuarios.length} usuario(s) registrado(s)`}
          </span>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} /> Nuevo Usuario
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Cargando usuarios...</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Email', 'Creado', 'Último acceso', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleString('es-PE')
                      : <span className="text-gray-400 italic">Nunca</span>}
                  </td>
                  <td className="px-4 py-3">
                    {cambiandoPass === u.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={nuevaPass}
                          onChange={e => setNuevaPass(e.target.value)}
                          placeholder="Nueva contraseña"
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button onClick={() => handleCambiarPassword(u.id)} className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200">
                          <Check size={13} />
                        </button>
                        <button onClick={() => { setCambiandoPass(null); setNuevaPass('') }} className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setCambiandoPass(u.id); setNuevaPass('') }}
                          className="p-1.5 rounded text-gray-500 hover:bg-yellow-50 hover:text-yellow-600"
                          title="Cambiar contraseña"
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          onClick={() => handleEliminar(u.id, u.email!)}
                          className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-gray-400 text-sm">
                    No hay usuarios registrados. Crea el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
