'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EscanerBoleta from '@/components/EscanerBoleta'
import {
  Plus, Download, ArrowLeft, Wallet, Receipt, TrendingDown, AlertTriangle,
  CheckCircle, Clock, XCircle, Flag, Eye, Trash2,
} from 'lucide-react'

interface Boleta {
  id: string
  estado: string
  marcado_error: boolean
  monto_pagado: number | null
  nota_chofer: string | null
  precision_ia: number | null
  datos_finales: Record<string, unknown> | null
  created_at: string
}
interface Adelanto {
  id: string
  n_adelanto: string | null
  ruta: string | null
  bus: string | null
  monto_asignado: number
  estado: string
  perfiles: { nombre: string; placa_vehiculo: string | null } | null
}

function dinero(n: number) { return `S/ ${n.toFixed(2)}` }

function estadoBadge(estado: string, error: boolean) {
  if (error) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700"><Flag size={11} /> Con error</span>
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    pendiente: { icon: <Clock size={11} />, cls: 'bg-yellow-100 text-yellow-700' },
    verificado: { icon: <CheckCircle size={11} />, cls: 'bg-green-100 text-green-700' },
    rechazado: { icon: <XCircle size={11} />, cls: 'bg-red-100 text-red-700' },
  }
  const s = map[estado] ?? { icon: null, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.icon} {estado}</span>
}

export default function AdelantoDetalle({
  adelanto, boletas, gastado, saldo, rol,
}: { adelanto: Adelanto; boletas: Boleta[]; gastado: number; saldo: number; rol: 'superadmin' | 'chofer' }) {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const base = rol === 'superadmin' ? '/dashboard' : '/portal'

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta boleta?')) return
    const res = await fetch(`/api/boletas/${id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  function exportar(formato: 'csv' | 'xlsx') {
    window.open(`/api/boletas/export?formato=${formato}&adelanto_id=${adelanto.id}`, '_blank')
  }

  return (
    <div className="space-y-5">
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Volver
      </Link>

      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Adelanto {adelanto.n_adelanto ?? '—'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {adelanto.perfiles?.nombre ?? '—'}
            {adelanto.bus ? ` · Bus ${adelanto.bus}` : ''}
            {adelanto.ruta ? ` · ${adelanto.ruta}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportar('csv')} className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => exportar('xlsx')} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700">
            <Download size={14} /> Excel
          </button>
          {!scanning && (
            <button onClick={() => setScanning(true)} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus size={14} /> Agregar boleta
            </button>
          )}
        </div>
      </div>

      {/* Reconciliación — las 3 tarjetas clave */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="inline-flex p-2 rounded-lg bg-blue-50 mb-3"><Wallet className="text-blue-600" size={20} /></div>
          <div className="text-2xl font-bold text-gray-900">{dinero(Number(adelanto.monto_asignado))}</div>
          <div className="text-sm text-gray-500 mt-1">Adelanto recibido</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="inline-flex p-2 rounded-lg bg-purple-50 mb-3"><Receipt className="text-purple-600" size={20} /></div>
          <div className="text-2xl font-bold text-gray-900">{dinero(gastado)}</div>
          <div className="text-sm text-gray-500 mt-1">Gastado en peajes ({boletas.filter(b => b.estado !== 'rechazado').length})</div>
        </div>
        <div className={`rounded-xl border p-5 ${saldo >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`inline-flex p-2 rounded-lg mb-3 ${saldo >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <TrendingDown className={saldo >= 0 ? 'text-green-600' : 'text-red-600'} size={20} />
          </div>
          <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>{dinero(Math.abs(saldo))}</div>
          <div className="text-sm text-gray-600 mt-1">
            {saldo >= 0 ? 'El chofer debe devolver' : 'La empresa debe al chofer'}
          </div>
        </div>
      </div>

      {/* Escáner inline */}
      {scanning && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Nueva boleta de peaje</h3>
          </div>
          <EscanerBoleta adelantoId={adelanto.id} onClose={() => setScanning(false)} />
        </div>
      )}

      {/* Lista de boletas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Boletas del adelanto</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Fecha', 'N° Documento', 'RUC', 'Monto', 'Precisión', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {boletas.map(b => {
                const d = (b.datos_finales ?? {}) as Record<string, unknown>
                return (
                  <tr key={b.id} className={`hover:bg-gray-50 ${b.marcado_error ? 'bg-orange-50/50' : ''}`}>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{String(d.fecha_documento || '—')}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{String(d.numero_documento || '—')}</td>
                    <td className="px-4 py-3 text-gray-600">{String(d.ruc || '—')}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{b.monto_pagado ? dinero(Number(b.monto_pagado)) : '—'}</td>
                    <td className="px-4 py-3">
                      {b.precision_ia !== null ? (
                        <span className={`font-semibold ${Number(b.precision_ia) >= 80 ? 'text-green-600' : Number(b.precision_ia) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{b.precision_ia}%</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">{estadoBadge(b.estado, b.marcado_error)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`${base}/boletas/${b.id}`} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600" title="Ver / editar">
                          <Eye size={15} />
                        </Link>
                        {rol === 'superadmin' && (
                          <button onClick={() => eliminar(b.id)} className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {boletas.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Aún no hay boletas. Agrega la primera.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {boletas.some(b => b.marcado_error) && rol === 'superadmin' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Hay boletas marcadas con error por el chofer. Revísalas para decidir si las corriges o eliminas.
        </div>
      )}
    </div>
  )
}
