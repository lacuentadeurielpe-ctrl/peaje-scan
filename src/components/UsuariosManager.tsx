'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, KeyRound, Check, X, Loader2, ShieldCheck } from 'lucide-react'

interface Chofer {
  id: string; nombre: string; dni: string | null; placa_vehiculo: string | null
  licencia: string | null; telefono: string | null; activo: boolean; created_at: string
}

const emptyForm = { email: '', password: '', nombre: '', dni: '', placa_vehiculo: '', licencia: '', telefono: '' }

export default function UsuariosManager() {
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cambiandoPass, setCambiandoPass] = useState<string | null>(null)
  const [nuevaPass, setNuevaPass] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const res = await fetch('/api/usuarios')
    if (res.ok) setChoferes(await res.json())
    setLoading(false)
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true); setError(''); setSuccess('')
    const res = await fetch('/api/usuarios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error)
    else {
      setSuccess(`Chofer ${form.nombre} creado. Comparte: ${form.email} / ${form.password}`)
      setForm(emptyForm); setShowForm(false); await cargar()
    }
    setCreating(false)
  }

  async function eliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar al chofer ${nombre}? Se borrará su cuenta y sus datos.`)) return
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    if (res.ok) { setChoferes(prev => prev.filter(c => c.id !== id)); setSuccess(`${nombre} eliminado`) }
  }

  async function cambiarPass(id: string) {
    if (nuevaPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: nuevaPass }),
    })
    if (res.ok) { setSuccess('Contraseña actualizada'); setCambiandoPass(null); setNuevaPass('') }
    else { const d = await res.json(); setError(d.error) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-blue-800">
          Tú creas las cuentas de los choferes. Ellos no se registran solos: defines su email y
          contraseña, se los compartes, y entran a su propio portal a subir boletas.
        </p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center justify-between">{error}<button onClick={() => setError('')}><X size={14} /></button></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center justify-between">{success}<button onClick={() => setSuccess('')}><X size={14} /></button></div>}

      {showForm && (
        <form onSubmit={crear} className="bg-white rounded-xl border border-blue-300 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Nuevo chofer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo *</label>
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">DNI</label>
              <input value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Placa</label>
              <input value={form.placa_vehiculo} onChange={e => setForm({ ...form, placa_vehiculo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Licencia</label>
              <input value={form.licencia} onChange={e => setForm({ ...form, licencia: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
              <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email de acceso *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="chofer@empresa.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña *</label>
              <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} placeholder="Mínimo 6 caracteres" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm) }} className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={creating} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Crear chofer
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-sm text-gray-500">{loading ? 'Cargando...' : `${choferes.length} chofer(es)`}</span>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus size={15} /> Nuevo Chofer
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400"><Loader2 size={20} className="animate-spin" /><span className="text-sm">Cargando...</span></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Nombre', 'DNI', 'Placa', 'Teléfono', 'Acciones'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {choferes.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{c.dni ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{c.placa_vehiculo ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.telefono ?? '—'}</td>
                  <td className="px-4 py-3">
                    {cambiandoPass === c.id ? (
                      <div className="flex items-center gap-2">
                        <input type="text" value={nuevaPass} onChange={e => setNuevaPass(e.target.value)} placeholder="Nueva contraseña" className="border border-gray-300 rounded px-2 py-1 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        <button onClick={() => cambiarPass(c.id)} className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200"><Check size={13} /></button>
                        <button onClick={() => { setCambiandoPass(null); setNuevaPass('') }} className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"><X size={13} /></button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { setCambiandoPass(c.id); setNuevaPass('') }} className="p-1.5 rounded text-gray-500 hover:bg-yellow-50 hover:text-yellow-600" title="Cambiar contraseña"><KeyRound size={15} /></button>
                        <button onClick={() => eliminar(c.id, c.nombre)} className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600" title="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {choferes.length === 0 && <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No hay choferes. Crea el primero.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
