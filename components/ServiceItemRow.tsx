'use client'

import type { ServiceItem, SizeOption, Prices } from '@/types'

const SERVICE_LABELS: Record<string, string> = {
  wash: 'ล้างแอร์',
  repair: 'ซ่อมแอร์',
  install: 'ติดตั้งแอร์',
}

interface Props {
  item: ServiceItem
  sizes: SizeOption[]
  prices: Prices
  onChange: (id: string, field: 'type' | 'btu', value: string) => void
  onDelete: (id: string) => void
  showDelete: boolean
}

export default function ServiceItemRow({ item, sizes, prices, onChange, onDelete, showDelete }: Props) {
  const price = prices[item.type]?.[item.btu]
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <select
          className="field-input"
          value={item.type}
          onChange={(e) => onChange(item.id, 'type', e.target.value)}
        >
          {Object.entries(SERVICE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <select
          className="field-input"
          value={item.btu}
          onChange={(e) => onChange(item.id, 'btu', e.target.value)}
        >
          {sizes.map((s) => (
            <option key={s.btu} value={s.btu}>
              {s.btu.toLocaleString()} BTU ({s.label})
            </option>
          ))}
        </select>
      </div>
      <div className="w-24 text-right text-sm font-medium text-ink">
        {price !== undefined ? `฿${price.toLocaleString()}` : '–'}
      </div>
      <div className="w-8 flex justify-center">
        {showDelete && (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="btn-danger"
            title="ลบรายการ"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
