import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfil } from '@/lib/auth'
import { COLUMNAS_EXPORT } from '@/lib/campos'
import ExcelJS from 'exceljs'

// Columnas que llevan formato de dinero
const COLS_DINERO = new Set(['Monto_Pagado', 'Monto_Afecto', 'Monto_No_Afecto', 'Monto_Impuestos', 'IGV'])

export async function GET(req: NextRequest) {
  const perfil = await getPerfil()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const formato = searchParams.get('formato') ?? 'csv'
  const adelanto_id = searchParams.get('adelanto_id')
  const estado = searchParams.get('estado')

  const supabase = createAdminClient()
  let query = supabase
    .from('boletas_peaje')
    .select('*, adelantos(*), perfiles(nombre)')
    .order('created_at', { ascending: false })

  if (perfil.rol === 'chofer') query = query.eq('chofer_id', perfil.id)
  if (adelanto_id) query = query.eq('adelanto_id', adelanto_id)
  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const boletas = data ?? []

  // Construir filas según el orden de columnas del CSV de la empresa
  const filas = boletas.map(b => {
    const fin = (b.datos_finales ?? {}) as Record<string, unknown>
    const adel = (b.adelantos ?? {}) as Record<string, unknown>

    // Campos compuestos como en el CSV de la empresa:
    // Descripcion = "BUS {bus} {ruta} - LGV: {correlativo} - ADEL: {n_adelanto}"
    // Descripcion_Gasto = "BUS {bus} {ruta}"
    const bus = String(adel.bus ?? '').trim()
    const ruta = String(adel.ruta ?? '').trim()
    const lgv = String(fin.correlativo_lgv ?? '').trim()
    const nAdel = String(adel.n_adelanto ?? '').trim()
    const busRuta = [bus ? `BUS ${bus}` : '', ruta].filter(Boolean).join(' ').trim()
    const descripcion = [busRuta, lgv ? `LGV: ${lgv}` : '', nAdel ? `ADEL: ${nAdel}` : '']
      .filter(Boolean).join(' - ')

    return COLUMNAS_EXPORT.map(col => {
      if (col.header === 'Descripcion') return descripcion
      if (col.header === 'Descripcion_Gasto') return busRuta
      const fuente = col.origen === 'adelanto' ? adel : fin
      const val = fuente[col.key] ?? ''
      if (COLS_DINERO.has(col.header)) {
        const n = Number(val)
        return val === '' || isNaN(n) ? '' : n
      }
      return String(val)
    })
  })

  // ---- CSV ----
  if (formato !== 'xlsx') {
    const esc = (v: unknown) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lineas = [COLUMNAS_EXPORT.map(c => c.header).join(',')]
    for (const fila of filas) lineas.push(fila.map(esc).join(','))
    return new NextResponse('﻿' + lineas.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="boletas.csv"',
      },
    })
  }

  // ---- Excel con formato ----
  const wb = new ExcelJS.Workbook()
  wb.creator = 'PeajeScan'
  wb.created = new Date()
  const ws = wb.addWorksheet('Boletas', {
    views: [{ state: 'frozen', ySplit: adelanto_id ? 6 : 3 }],
  })

  const nCols = COLUMNAS_EXPORT.length
  const lastCol = ws.getColumn(nCols).letter

  // Título
  ws.mergeCells(`A1:${lastCol}1`)
  const titulo = ws.getCell('A1')
  titulo.value = 'PeajeScan — Reporte de Boletas de Peaje'
  titulo.font = { bold: true, size: 16, color: { argb: 'FF1E3A8A' } }
  titulo.alignment = { vertical: 'middle' }
  ws.getRow(1).height = 26

  // Subtítulo con fecha y filtro
  ws.mergeCells(`A2:${lastCol}2`)
  const sub = ws.getCell('A2')
  const fechaStr = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
  sub.value = `Generado el ${fechaStr} · ${boletas.length} boleta(s)`
  sub.font = { size: 10, color: { argb: 'FF6B7280' } }

  let headerRowIdx = 3

  // Bloque resumen (solo si es un adelanto específico)
  if (adelanto_id && boletas.length > 0) {
    const adel = (boletas[0].adelantos ?? {}) as Record<string, unknown>
    const chofer = (boletas[0].perfiles as { nombre?: string } | null)?.nombre ?? '—'
    const asignado = Number(adel.monto_asignado) || 0
    const gastado = boletas
      .filter(b => b.estado !== 'rechazado')
      .reduce((s, b) => s + (Number(b.monto_pagado) || 0), 0)
    const saldo = asignado - gastado

    const resumen: [string, string, number][] = [
      ['Chofer', String(adel.ruta ? `${chofer}` : chofer), NaN],
      ['Ruta', String(adel.ruta ?? '—'), NaN],
    ]
    ws.getCell('A3').value = `Chofer: ${chofer}    Ruta: ${adel.ruta ?? '—'}    Bus: ${adel.bus ?? '—'}`
    ws.getCell('A3').font = { size: 10, bold: true, color: { argb: 'FF374151' } }
    ws.mergeCells(`A3:${lastCol}3`)
    void resumen

    const r4 = ws.getRow(4)
    r4.getCell(1).value = 'Adelanto:'
    r4.getCell(2).value = asignado
    r4.getCell(4).value = 'Gastado:'
    r4.getCell(5).value = gastado
    r4.getCell(7).value = 'Saldo a devolver:'
    r4.getCell(8).value = saldo
    for (const c of [1, 4, 7]) r4.getCell(c).font = { bold: true, color: { argb: 'FF374151' } }
    for (const c of [2, 5, 8]) {
      r4.getCell(c).numFmt = '"S/ "#,##0.00'
      r4.getCell(c).font = { bold: true }
    }
    r4.getCell(8).font = { bold: true, size: 12, color: { argb: saldo >= 0 ? 'FF047857' : 'FFB91C1C' } }
    ws.addRow([])
    headerRowIdx = 6
  }

  // Encabezados de columnas
  const headerRow = ws.getRow(headerRowIdx)
  COLUMNAS_EXPORT.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = col.header
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })
  headerRow.height = 28

  // Filas de datos
  filas.forEach((fila, idx) => {
    const row = ws.addRow(fila)
    row.eachCell((cell, colNum) => {
      cell.border = thinBorder()
      cell.font = { size: 10 }
      if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      const header = COLUMNAS_EXPORT[colNum - 1]?.header
      if (header && COLS_DINERO.has(header)) {
        cell.numFmt = '#,##0.00'
        cell.alignment = { horizontal: 'right' }
      }
    })
  })

  // Fila de total (suma de Monto_Pagado)
  const idxMonto = COLUMNAS_EXPORT.findIndex(c => c.header === 'Monto_Pagado')
  if (idxMonto >= 0 && filas.length > 0) {
    const totalRow = ws.addRow([])
    const labelCell = totalRow.getCell(Math.max(1, idxMonto))
    labelCell.value = 'TOTAL'
    labelCell.font = { bold: true }
    labelCell.alignment = { horizontal: 'right' }
    const totalCell = totalRow.getCell(idxMonto + 1)
    const total = filas.reduce((s, f) => s + (typeof f[idxMonto] === 'number' ? (f[idxMonto] as number) : 0), 0)
    totalCell.value = total
    totalCell.numFmt = '"S/ "#,##0.00'
    totalCell.font = { bold: true, color: { argb: 'FF1E3A8A' } }
    totalRow.eachCell(c => { c.border = thinBorder() })
  }

  // Anchos de columna
  COLUMNAS_EXPORT.forEach((col, i) => {
    const maxLen = Math.max(
      col.header.length,
      ...filas.map(f => String(f[i] ?? '').length)
    )
    ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 2, 10), 28)
  })

  const buf = await wb.xlsx.writeBuffer()
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="boletas.xlsx"',
    },
  })
}

function thinBorder(): import('exceljs').Borders {
  const s = { style: 'thin' as const, color: { argb: 'FFD1D5DB' } }
  return { top: s, left: s, bottom: s, right: s, diagonal: { style: undefined } } as import('exceljs').Borders
}
