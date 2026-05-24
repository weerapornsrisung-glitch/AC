import type { PricingData, SizeOption, DistanceOption, Prices } from '@/types'

export const SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQb3PP4W0hw2FF5j32puu-Frc4DRnXGarXPif1qOGePLHHGl-1-jGnx06FCgGcFSiqPboR7diZmFL5X/pub?output=csv'

export const DEFAULT_SIZES: SizeOption[] = [
  { btu: 9000, label: 'เล็ก' },
  { btu: 12000, label: 'กลาง' },
  { btu: 18000, label: 'ใหญ่' },
  { btu: 24000, label: 'ใหญ่พิเศษ' },
]

export const DEFAULT_PRICES: Prices = {
  wash: { 9000: 500, 12000: 650, 18000: 800, 24000: 950 },
  repair: { 9000: 800, 12000: 950, 18000: 1100, 24000: 1300 },
  install: { 9000: 1500, 12000: 1800, 18000: 2200, 24000: 2800 },
}

export const DEFAULT_DISTANCE_OPTIONS: DistanceOption[] = [
  { label: '0–5 กม.', fee: 0 },
  { label: '6–10 กม.', fee: 50 },
  { label: '11–20 กม.', fee: 100 },
  { label: '21–30 กม.', fee: 200 },
  { label: '31–50 กม.', fee: 300 },
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

export function parseRateSheet(csv: string): { sizes: SizeOption[]; prices: Prices; ok: boolean } {
  try {
    const rows = parseCSV(csv)
    if (rows.length < 2) return { sizes: DEFAULT_SIZES, prices: DEFAULT_PRICES, ok: false }
    const header = rows[0]
    const sizes: SizeOption[] = []
    const btuCols: { idx: number; btu: number }[] = []
    for (let i = 1; i < header.length; i++) {
      const stripped = header[i].replace(/,/g, '')
      const match = stripped.match(/(\d{4,})/)
      const btu = match ? parseInt(match[1], 10) : NaN
      if (!isNaN(btu)) {
        btuCols.push({ idx: i, btu })
        const sizeLabel = btu <= 9000 ? 'เล็ก' : btu <= 12000 ? 'กลาง' : btu <= 18000 ? 'ใหญ่' : 'ใหญ่พิเศษ'
        sizes.push({ btu, label: sizeLabel })
      }
    }
    if (sizes.length === 0) return { sizes: DEFAULT_SIZES, prices: DEFAULT_PRICES, ok: false }
    const prices: Prices = {
      wash: { ...DEFAULT_PRICES.wash },
      repair: { ...DEFAULT_PRICES.repair },
      install: { ...DEFAULT_PRICES.install },
    }
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      const name = row[0] || ''
      let key: keyof Prices | null = null
      if (name.includes('ล้าง')) key = 'wash'
      else if (name.includes('ซ่อม')) key = 'repair'
      else if (name.includes('ติดตั้ง')) key = 'install'
      if (!key) continue
      const map: Record<number, number> = {}
      for (const { idx, btu } of btuCols) {
        const val = toNum(row[idx] || '')
        if (!isNaN(val)) map[btu] = val
      }
      prices[key] = map
    }
    return { sizes, prices, ok: true }
  } catch {
    return { sizes: DEFAULT_SIZES, prices: DEFAULT_PRICES, ok: false }
  }
}

export function parseTravelSheet(csv: string): { options: DistanceOption[]; ok: boolean } {
  try {
    const rows = parseCSV(csv)
    if (rows.length < 2) return { options: DEFAULT_DISTANCE_OPTIONS, ok: false }
    const options: DistanceOption[] = []
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      if (!row[0]?.trim()) continue
      const label = row[0].trim()
      let fee = 0
      for (let i = row.length - 1; i >= 1; i--) {
        const val = row[i]?.trim()
        if (val) { fee = toNum(val); break }
      }
      options.push({ label, fee: isNaN(fee) ? 0 : fee })
    }
    if (options.length === 0) return { options: DEFAULT_DISTANCE_OPTIONS, ok: false }
    return { options, ok: true }
  } catch {
    return { options: DEFAULT_DISTANCE_OPTIONS, ok: false }
  }
}

export async function fetchPricing(): Promise<PricingData> {
  let sizes = DEFAULT_SIZES
  let prices = DEFAULT_PRICES
  let distanceOptions = DEFAULT_DISTANCE_OPTIONS
  let rateOk = false
  let travelOk = false

  try {
    const rateRes = await fetch(`${SHEET_BASE}&sheet=Rate`, { cache: 'no-store' })
    if (rateRes.ok) {
      const csv = await rateRes.text()
      const result = parseRateSheet(csv)
      sizes = result.sizes
      prices = result.prices
      rateOk = result.ok
    }
  } catch {}

  try {
    const travelRes = await fetch(`${SHEET_BASE}&sheet=Travel%20expense`, { cache: 'no-store' })
    if (travelRes.ok) {
      const csv = await travelRes.text()
      const result = parseTravelSheet(csv)
      distanceOptions = result.options
      travelOk = result.ok
    }
  } catch {}

  return { sizes, prices, distanceOptions, source: { rate: rateOk, travel: travelOk } }
}
