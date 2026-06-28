'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Download, Filter, Eye, Trash2, CheckCircle, Clock, XCircle, Plus } from 'lucide-react'

interface Chofer { id: string; nombre: string }
interface Boleta {
  id: string
  chofer_id: string | null
  imagen_url: string | null
  estado: string
  datos_ia: Record<string, unknown> | null
  datos_finales: Record<string, unknown> | null
  campos_editados: string[]
  precision_ia: number | null
  notas: string | null
  created_at: string
  choferes: { nombre: string; placa_vehiculo: string | null } | null
}

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'verificado', label: 'Verificado' },
  { value: 'rechazado', label: 'Rechazado' },
]

function estadoBadge(estado: string) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    pendiente: { icon: <Clock size={12} />, cls: 'bg-yellow-100 text-yellow-700' },
    verificado: { icon: <CheckCircle size={12} />, cls: 'bg-green-100 text-green-700' },
    rechazado: { icon: <XCircle size={12} />, cls: 'bg-red-100 text-red-700' },
  }
  const s = map[estado] ?? { icon: null, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.icon} {estado}
    </span>
  )
}

export default function BolетasList({ initialBoletas, choferes }: { initialBoletas: Boleta[]; choferes: Chofer[] }) {
  const [boletas, setBoletas] = useState(initialBoletas)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroChofer, setFiltroChofer] = useState('')

  const filtradas = boletas.filter(b => {
    if (filtroEstado && b.estado !== filtroEstado) return false
    if (filtroChofer && b.chofer_id !== filtroChofer) return false
    return true
  })

  async function handleVerificar(id: string, estado: 'verificado' | 'rechazado') {
    const res = await fetch(`/api/boletas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    if (res.ok) {
      setBoletas(prev => prev.map(b => b.id === id ? { ...b, estado } : b))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta boleta?')) return
    const res = await fetch(`/api/boletas/${id}`, { method: 'DELETE' })
    if (res.ok) setBoletas(prev => prev.filter(b => b.id !== id))
  }

  function exportar(formato: 'csv' | 'xlsx') {
    const params = new URLSearchParams({ formato })
    if (filtroEstado) params.set('estado', filtroEstado)
    if (filtroChofer) params.set('chofer_id', filtroChofer)
    window.open(`/api/boletas/export?${params}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Filtros + Acciones */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          value={filtroChofer}
          onChange={e => setFiltroChofer(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los choferes</option>
          {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <span className="text-xs text-gray-500 ml-auto">{filtradas.length} resultado(s)</span>
        <button onClick={() => exportar('csv')} className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <Download size={14} /> CSV
        </button>
        <button onClick={() => exportar('xlsx')} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
          <Download size={14} /> Excel
        </button>
        <Link href="/dashboard/boletas/nueva" className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Nueva
        </Link>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Fecha', 'Chofer', 'Estación', 'Placa', 'Monto', 'Precisión IA', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map(b => {
                const d = (b.datos_finales ?? b.datos_ia ?? {}) as Record<string, unknown>
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.choferes?.nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{String(d.estacion || '—')}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{String(d.placa || b.choferes?.placa_vehiculo || '—')}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {d.monto ? `S/ ${Number(d.monto).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {b.precision_ia !== null ? (
                        <span className={`font-semibold ${Number(b.precision_ia) >= 80 ? 'text-green-600' : Number(b.precision_ia) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {b.precision_ia}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">{estadoBadge(b.estado)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/boletas/${b.id}`} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600" title="Ver detalle">
                          <Eye size={15} />
                        </Link>
                        {b.estado === 'pendiente' && (
                          <>
                            <button onClick={() => handleVerificar(b.id, 'verificado')} className="p-1.5 rounded text-gray-500 hover:bg-green-50 hover:text-green-600" title="Verificar">
                              <CheckCircle size={15} />
                            </button>
                            <button onClick={() => handleVerificar(b.id, 'rechazado')} className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600" title="Rechazar">
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400 text-sm">
                    No hay boletas registradas con estos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
