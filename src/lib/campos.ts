// Configuración central de los campos de una boleta de peaje.
// Estos son los campos que extrae la IA de la imagen y que se muestran en la
// tabla editable. Los campos de "adelanto" (Bus, Ruta, N_Adelanto, etc.) NO van
// aquí: los asigna el superadmin al crear el adelanto.

export interface CampoBoleta {
  key: string
  label: string
  tipo: 'text' | 'number' | 'date'
  // valor por defecto sugerido (campos casi fijos pero editables)
  default?: string
}

export const CAMPOS_BOLETA: CampoBoleta[] = [
  { key: 'fecha_documento', label: 'Fecha Documento', tipo: 'date' },
  { key: 'numero_documento', label: 'N° Documento', tipo: 'text' },
  { key: 'ruc', label: 'RUC', tipo: 'text' },
  { key: 'tipo_comprobante', label: 'Tipo Comprobante', tipo: 'text' },
  { key: 'descripcion_gasto', label: 'Descripción Gasto', tipo: 'text' },
  { key: 'correlativo_lgv', label: 'Correlativo LGV', tipo: 'text' },
  { key: 'monto_pagado', label: 'Monto Pagado (S/)', tipo: 'number' },
  { key: 'monto_afecto', label: 'Monto Afecto (S/)', tipo: 'number', default: '0' },
  { key: 'monto_no_afecto', label: 'Monto No Afecto (S/)', tipo: 'number', default: '0' },
  { key: 'igv', label: 'IGV monto (S/)', tipo: 'number', default: '0' }, // va a la columna Monto_Impuestos
  // Detracción leída de la boleta
  { key: 'monto_detraccion', label: 'Monto Detracción (S/)', tipo: 'number', default: '0' }, // va a la columna Retencion
  { key: 'constancia', label: 'Constancia (cód. detracción)', tipo: 'text' },
  // Campos casi fijos: valor por defecto editable
  { key: 'codigo_igv', label: 'Código IGV (A=carga / B=personas)', tipo: 'text', default: 'B' }, // va a la columna IGV
  { key: 'detraccion', label: 'Detracción (tipo)', tipo: 'text', default: 'Detr. Transport' },
  { key: 'tipo_impuesto', label: 'Tipo Impuesto', tipo: 'text' },
  { key: 'tipo_pago', label: 'Tipo Pago', tipo: 'text' },
  { key: 'concepto', label: 'Concepto', tipo: 'text' },
  { key: 'tipo_registro', label: 'Tipo Registro', tipo: 'text' },
]

// Campos del adelanto (asignados por el superadmin)
export interface CampoAdelanto {
  key: string
  label: string
  tipo: 'text' | 'number' | 'date'
  default?: string
}

export const CAMPOS_ADELANTO: CampoAdelanto[] = [
  { key: 'n_adelanto', label: 'N° Adelanto', tipo: 'text' },
  { key: 'codigo_spring', label: 'Código Spring', tipo: 'text' },
  { key: 'persona', label: 'Persona (cód.)', tipo: 'text' },
  { key: 'bus', label: 'Bus', tipo: 'text' },
  { key: 'ruta', label: 'Ruta / Descripción', tipo: 'text' },
  { key: 'almacen_entrega', label: 'Almacén Entrega', tipo: 'text', default: 'ALMACEN MATRIZ' },
  { key: 'centro_costo', label: 'Centro Costo', tipo: 'text' },
  { key: 'fecha_liquidacion', label: 'Fecha Liquidación', tipo: 'date' },
  { key: 'monto_asignado', label: 'Monto Asignado (S/)', tipo: 'number' },
]

// Orden de columnas para la exportación CSV/Excel (formato empresa)
export const COLUMNAS_EXPORT: { header: string; origen: 'adelanto' | 'boleta'; key: string }[] = [
  { header: 'Codigo_Spring', origen: 'adelanto', key: 'codigo_spring' },
  { header: 'Persona', origen: 'adelanto', key: 'persona' },
  { header: 'Tipo_Pago', origen: 'boleta', key: 'tipo_pago' },
  { header: 'Fecha_Liquidacion', origen: 'adelanto', key: 'fecha_liquidacion' },
  { header: 'Descripcion', origen: 'adelanto', key: 'ruta' },
  { header: 'Almacen_Entrega', origen: 'adelanto', key: 'almacen_entrega' },
  { header: 'Bus', origen: 'adelanto', key: 'bus' },
  { header: 'Centro_Costo', origen: 'adelanto', key: 'centro_costo' },
  { header: 'Correlativo_LGV', origen: 'boleta', key: 'correlativo_lgv' },
  { header: 'N_Adelanto', origen: 'adelanto', key: 'n_adelanto' },
  { header: 'Tipo_Registro', origen: 'boleta', key: 'tipo_registro' },
  { header: 'Fecha_Documento', origen: 'boleta', key: 'fecha_documento' },
  { header: 'Concepto', origen: 'boleta', key: 'concepto' },
  { header: 'Descripcion_Gasto', origen: 'boleta', key: 'descripcion_gasto' },
  { header: 'Monto_Pagado', origen: 'boleta', key: 'monto_pagado' },
  { header: 'Tipo_Impuesto', origen: 'boleta', key: 'tipo_impuesto' },
  { header: 'RUC', origen: 'boleta', key: 'ruc' },
  { header: 'Tipo_Comprobante', origen: 'boleta', key: 'tipo_comprobante' },
  { header: '# Documento', origen: 'boleta', key: 'numero_documento' },
  { header: 'Monto_Afecto', origen: 'boleta', key: 'monto_afecto' },
  { header: 'Monto_No_Afecto', origen: 'boleta', key: 'monto_no_afecto' },
  { header: 'Monto_Impuestos', origen: 'boleta', key: 'igv' },         // monto del IGV
  { header: 'IGV', origen: 'boleta', key: 'codigo_igv' },              // código A/B (no monto)
  { header: 'Detraccion', origen: 'boleta', key: 'detraccion' },       // "Detr. Transport" / "No aplica"
  { header: 'Constancia', origen: 'boleta', key: 'constancia' },       // código de detracción
  { header: 'Retencion', origen: 'boleta', key: 'monto_detraccion' },  // monto de la detracción
]
