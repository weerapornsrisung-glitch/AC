import type { PricingData, SizeOption, DistanceOption, Prices } from '@/types'

export const SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQb3PP4W0hw2FF5j32puu-Frc4DRnXGarXPif1qOGePLHHGl-1-jGnx06FCgGcFSiqPboR7diZmFL5X/pub?output=csv'

// Structural defaults only — NO hardcoded prices
export const DEFAULT_SIZES: SizeOption[] = [
  { key: '9000',  label: '9,000 BTU' },
  { key: '12000', label: '12,000 BTU' },
  { key: '18000', label: '18,000 BTU' },
  { key: '24000', label: '24,000 BTU' },
]

export const EMPTY_PRICES: Prices = { wash: {}, repair: {}, install: {} }

export const DEFAULT_DISTANCE_OPTIONS: DistanceOption[] = [
  { label: '0–5 กม.',         fee: 0   },
  { label: '6–10 กม.',        fee: 50  },
  { label: '11–20 กม.',       fee: 100 },
  { label: '21–30 กม.',       fee: 200 },
  { label: '31–50 กม.',       fee: 300 },
  { label: 'มากกว่า 50 กม.', fee: 500 },
]

function toNum(str: string): number {
  return parseInt(str.replace(/[^0-9]/g, ''), 10)
}

export function parseCSV(raw: string): string[][] {
  const text = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows: string[][] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const cells: string[] = []
    let cur = ''
    let inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { cells.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    cells.push(cur.trim())
    rows.push(cells)
  }
  return rows
}

// Parses any cross-table format where:
//   row 0 = header (col 0 ignored, col 1+ = size labels)
//   row 1+ = service rows (col 0 = service name containing ล้าง/ซ่อม/ติดตั้ง)
// The size key is the normalized header text — format-agnostic.
export function parseRateSheet(csv: string): { sizes: SizeOption[]; prices: Prices; ok: boolean } {
  const rows = parseCSV(csv)
  if (rows.length < 2) return { sizes: DEFAULT_SIZES, prices: EMPTY_PRICES, ok: false }

  const header = rows[0]
  const sizeCols: { idx: number; key: string; label: string }[] = []

  for (let i = 1; i < header.length; i++) {
    const raw = header[i].trim()
    if (!raw) continue
    // Normalize: strip commas, collapse whitespace → use as lookup key
    const key = raw.replace(/,/g, '').replace(/\s+/g, ' ').trim()
    sizeCols.push({ idx: i, key, label: raw })
  }

  if (!sizeCols.length) return { sizes: DEFAULT_SIZES, prices: EMPTY_PRICES, ok: false }

  const sizes: SizeOption[] = sizeCols.map(s => ({ key: s.key, label: s.label }))
  const prices: Prices = { wash: {}, repair: {}, install: {} }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const name = (row[0] || '').trim()
    if (!name) continue

    let svcKey: keyof Prices | null = null
    if (name.includes('ล้าง'))     svcKey = 'wash'
    else if (name.includes('ซ่อม'))    svcKey = 'repair'
    else if (name.includes('ติดตั้ง')) svcKey = 'install'
    if (!svcKey) continue

    for (const { idx, key } of sizeCols) {
      const val = toNum(row[idx] ?? '')
      if (!isNaN(val) && val > 0) prices[svcKey][key] = val
    }
  }

  const hasAnyPrice = Object.values(prices).some(p => Object.keys(p).length > 0)
  if (!hasAnyPrice) return { sizes: DEFAULT_SIZES, prices: EMPTY_PRICES, ok: false }

  return { sizes, prices, ok: true }
}

export function parseTravelSheet(csv: string): { options: DistanceOption[]; ok: boolean } {
  const rows = parseCSV(csv)
  if (rows.length < 2) return { options: DEFAULT_DISTANCE_OPTIONS, ok: false }
  const options: DistanceOption[] = []
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const label = row[0]?.trim()
    if (!label) continue
    let fee = 0
    for (let i = row.length - 1; i >= 1; i--) {
      const v = row[i]?.trim()
      if (v) { fee = toNum(v); break }
    }
    options.push({ label, fee: isNaN(fee) ? 0 : fee })
  }
  if (!options.length) return { options: DEFAULT_DISTANCE_OPTIONS, ok: false }
  return { options, ok: true }
}

export async function fetchPricing(): Promise<PricingData> {
  let sizes = DEFAULT_SIZES
  let prices = EMPTY_PRICES
  let distanceOptions = DEFAULT_DISTANCE_OPTIONS
  let rateOk = false
  let travelOk = false

  try {
    const rateRes = await fetch(`${SHEET_BASE}&sheet=Rate`, { cache: 'no-store' })
    if (rateRes.ok) {
      const result = parseRateSheet(await rateRes.text())
      sizes    = result.sizes
      prices   = result.prices
      rateOk   = result.ok
    }
  } catch (e) {
    console.error('[sheets] Rate fetch error:', e)
  }

  try {
    const travelRes = await fetch(`${SHEET_BASE}&sheet=Travel%20expense`, { cache: 'no-store' })
    if (travelRes.ok) {
      const result = parseTravelSheet(await travelRes.text())
      distanceOptions = result.options
      travelOk        = result.ok
    }
  } catch (e) {
    console.error('[sheets] Travel fetch error:', e)
  }

  return { sizes, prices, distanceOptions, source: { rate: rateOk, travel: travelOk } }
}
