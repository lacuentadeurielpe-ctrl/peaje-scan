'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CAMPOS_ADELANTO } from '@/lib/campos'
import { Plus, Wallet, Loader2, X, ChevronRight } from 'lucide-react'

interface Chofer { id: string; nombre: string; placa_vehiculo: string | null }
interface Adelanto {
  id: string; chofer_id: string; n_adelanto: string | null; ruta: string | null; bus: string | null
  monto_asignado: number; estado: string
  perfiles: { nombre: string; placa_vehiculo: string | null } | null
}

function dinero(n: number) { return `S/ ${n.toFixed(2)}` }

export default function AdelantosManager({
  initialAdelantos, choferes, gastadoPorAdelanto,
}: { initialAdelantos: Adelanto[]; choferes: Chofer[]; gastadoPorAdelanto: Record<string, number> }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [choferId, setChoferId] = useState('')
  const [form, setForm] = useState<Record<string, string>>(() => {
    const f: Record<string, string> = {}
    for (const c of CAMPOS_ADELANTO) f[c.key] = c.default ?? ''
    return f
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    if (!choferId) { setError('Selecciona un chofer'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/adelantos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chofer_id: choferId, ...form }),
    })
    setSaving(false)
    if (res.ok) { setShowForm(false); router.refresh() }
    else { const d = await res.json(); setError(d.error) }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">{error}</div>}

      {/* Formulario nuevo adelanto */}
      {showForm ? (
        <form onSubmit={crear} className="bg-white rounded-xl border border-blue-300 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Nuevo adelanto</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Chofer *</label>
            <select value={choferId} onChange={e => setChoferId(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona un chofer</option>
              {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.placa_vehiculo ? ` — ${c.placa_vehiculo}` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CAMPOS_ADELANTO.map(({ key, label, tipo }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type={tipo === 'date' ? 'date' : tipo} value={form[key] ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Crear adelanto
            </button>
          </div>
        </form>
      ) : (
        <div className="flex justify-end">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> Nuevo Adelanto
          </button>
        </div>
      )}

      {/* Lista de adelantos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialAdelantos.map(a => {
          const gastado = gastadoPorAdelanto[a.id] ?? 0
          const saldo = Number(a.monto_asignado) - gastado
          return (
            <Link key={a.id} href={`/dashboard/adelantos/${a.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="inline-flex p-2 rounded-lg bg-blue-50"><Wallet className="text-blue-600" size={18} /></div>
                <ChevronRight className="text-gray-300 group-hover:text-blue-500" size={18} />
              </div>
              <div className="font-semibold text-gray-900">{a.perfiles?.nombre ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Adelanto {a.n_adelanto ?? '—'}{a.bus ? ` · Bus ${a.bus}` : ''}
              </div>
              {a.ruta && <div className="text-xs text-gray-400 mt-0.5 truncate">{a.ruta}</div>}
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-1 text-center">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Asignado</div>
                  <div className="text-sm font-semibold text-gray-700">{dinero(Number(a.monto_asignado))}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Gastado</div>
                  <div className="text-sm font-semibold text-gray-700">{dinero(gastado)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Saldo</div>
                  <div className={`text-sm font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{dinero(saldo)}</div>
                </div>
              </div>
            </Link>
          )
        })}
        {initialAdelantos.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
            No hay adelantos. Crea el primero para asignar dinero a un chofer.
          </div>
        )}
      </div>
    </div>
  )
}
