'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

interface Chofer {
  id: string
  nombre: string
  dni: string | null
  placa_vehiculo: string | null
  empresa: string | null
  activo: boolean
  created_at: string
}

interface Props {
  initialChoferes: Chofer[]
}

const emptyForm = { nombre: '', dni: '', placa_vehiculo: '', empresa: '' }

export default function ChoferesList({ initialChoferes }: Props) {
  const [choferes, setChoferes] = useState(initialChoferes)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function startEdit(c: Chofer) {
    setEditId(c.id)
    setForm({ nombre: c.nombre, dni: c.dni ?? '', placa_vehiculo: c.placa_vehiculo ?? '', empresa: c.empresa ?? '' })
  }

  async function handleSave() {
    if (!form.nombre.trim()) return
    setLoading(true)
    if (editId) {
      const { data } = await supabase.from('choferes').update(form).eq('id', editId).select().single()
      if (data) setChoferes(prev => prev.map(c => c.id === editId ? data : c))
      setEditId(null)
    } else {
      const { data } = await supabase.from('choferes').insert(form).select().single()
      if (data) setChoferes(prev => [data, ...prev])
      setShowForm(false)
    }
    setForm(emptyForm)
    setLoading(false)
  }

  async function handleToggle(c: Chofer) {
    const { data } = await supabase.from('choferes').update({ activo: !c.activo }).eq('id', c.id).select().single()
    if (data) setChoferes(prev => prev.map(x => x.id === c.id ? data : x))
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este chofer?')) return
    await supabase.from('choferes').delete().eq('id', id)
    setChoferes(prev => prev.filter(c => c.id !== id))
  }

  const FormRow = () => (
    <tr className="bg-blue-50">
      {['nombre', 'dni', 'placa_vehiculo', 'empresa'].map(field => (
        <td key={field} className="px-4 py-2">
          <input
            className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder={field === 'nombre' ? 'Nombre *' : field === 'dni' ? 'DNI' : field === 'placa_vehiculo' ? 'Placa' : 'Empresa'}
            value={form[field as keyof typeof form]}
            onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
          />
        </td>
      ))}
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={loading} className="p-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
            <Check size={16} />
          </button>
          <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm) }} className="p-1 rounded bg-gray-300 text-gray-700 hover:bg-gray-400">
            <X size={16} />
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <span className="text-sm text-gray-500">{choferes.length} chofer(es)</span>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} /> Agregar Chofer
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Nombre', 'DNI', 'Placa', 'Empresa', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {showForm && !editId && <FormRow />}
            {choferes.map(c => (
              editId === c.id ? (
                <FormRow key={c.id} />
              ) : (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{c.dni ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono">{c.placa_vehiculo ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.empresa ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(c)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {choferes.length === 0 && !showForm && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  No hay choferes registrados. Agrega el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
