'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Download, Filter, Eye, CheckCircle, Clock, XCircle, Flag } from 'lucide-react'

interface Chofer { id: string; nombre: string }
interface Boleta {
  id: string; chofer_id: string | null; estado: string; marcado_error: boolean
  monto_pagado: number | null; precision_ia: number | null
  datos_finales: Record<string, unknown> | null; created_at: string
  perfiles: { nombre: string; placa_vehiculo: string | null } | null
  adelantos: { n_adelanto: string | null; ruta: string | null; bus: string | null } | null
}

function dinero(n: number) { return `S/ ${n.toFixed(2)}` }

function badge(estado: string, error: boolean) {
  if (error) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700"><Flag size={11} /> Con error</span>
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    pendiente: { icon: <Clock size={11} />, cls: 'bg-yellow-100 text-yellow-700' },
    verificado: { icon: <CheckCircle size={11} />, cls: 'bg-green-100 text-green-700' },
    rechazado: { icon: <XCircle size={11} />, cls: 'bg-red-100 text-red-700' },
  }
  const s = map[estado] ?? { icon: null, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.icon} {estado}</span>
}

export default function BoletasGlobal({ initialBoletas, choferes, soloError }: { initialBoletas: Boleta[]; choferes: Chofer[]; soloError?: boolean }) {
  const [estado, setEstado] = useState('')
  const [chofer, setChofer] = useState('')
  const [error, setError] = useState(!!soloError)

  const filtradas = initialBoletas.filter(b => {
    if (estado && b.estado !== estado) return false
    if (chofer && b.chofer_id !== chofer) return false
    if (error && !b.marcado_error) return false
    return true
  })

  function exportar(formato: 'csv' | 'xlsx') {
    const p = new URLSearchParams({ formato })
    if (estado) p.set('estado', estado)
    window.open(`/api/boletas/export?${p}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        <select value={estado} onChange={e => setEstado(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="verificado">Verificado</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <select value={chofer} onChange={e => setChofer(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los choferes</option>
          {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={error} onChange={e => setError(e.target.checked)} className="rounded" />
          Solo con error
        </label>
        <span className="text-xs text-gray-500 ml-auto">{filtradas.length} resultado(s)</span>
        <button onClick={() => exportar('csv')} className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Download size={14} /> CSV</button>
        <button onClick={() => exportar('xlsx')} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700"><Download size={14} /> Excel</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Fecha', 'Chofer', 'Adelanto', 'N° Doc', 'Monto', 'Precisión', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map(b => {
                const d = (b.datos_finales ?? {}) as Record<string, unknown>
                return (
                  <tr key={b.id} className={`hover:bg-gray-50 ${b.marcado_error ? 'bg-orange-50/50' : ''}`}>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{String(d.fecha_documento || new Date(b.created_at).toLocaleDateString('es-PE'))}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.perfiles?.nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{b.adelantos?.n_adelanto ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{String(d.numero_documento || '—')}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{b.monto_pagado ? dinero(Number(b.monto_pagado)) : '—'}</td>
                    <td className="px-4 py-3">
                      {b.precision_ia !== null ? <span className={`font-semibold ${Number(b.precision_ia) >= 80 ? 'text-green-600' : Number(b.precision_ia) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{b.precision_ia}%</span> : '—'}
                    </td>
                    <td className="px-4 py-3">{badge(b.estado, b.marcado_error)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/boletas/${b.id}`} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600 inline-flex" title="Ver"><Eye size={15} /></Link>
                    </td>
                  </tr>
                )
              })}
              {filtradas.length === 0 && <tr><td colSpan={8} className="text-center py-16 text-gray-400 text-sm">No hay boletas con estos filtros</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
