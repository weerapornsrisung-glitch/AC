'use client'

import type { ServiceItem, PricingData } from '@/types'

const SERVICE_LABELS: Record<string, string> = {
  wash: 'ล้างแอร์',
  repair: 'ซ่อมแอร์',
  install: 'ติดตั้งแอร์',
}

interface Props {
  items: ServiceItem[]
  selectedDistIdx: number | null
  pricing: PricingData
  onRefresh: () => void
  refreshing: boolean
}

export default function SummarySidebar({ items, selectedDistIdx, pricing, onRefresh, refreshing }: Props) {
  const { sizes, prices, distanceOptions, source } = pricing

  const subtotal = items.reduce((s, item) => s + (prices[item.type]?.[item.btu] ?? 0), 0)
  const travelFee = selectedDistIdx !== null ? (distanceOptions[selectedDistIdx]?.fee ?? 0) : 0
  const total = subtotal + travelFee

  const sourceLabel = source.rate && source.travel
    ? '● Rate ✓  Travel ✓  (จาก Google Sheet)'
    : source.rate
    ? '● Rate ✓  (Travel ใช้ค่าเริ่มต้น)'
    : source.travel
    ? '● Travel ✓  (Rate ใช้ค่าเริ่มต้น)'
    : '● ราคาเริ่มต้น (โหลด Sheet ไม่ได้)'
  const sourceColor = (source.rate || source.travel) ? '#2d7a2d' : '#c0392b'

  return (
    <div className="sticky top-6 flex flex-col gap-4">

      {/* Live summary */}
      <div className="summary-card p-5">
        <h2 className="text-[18px] font-semibold text-ink mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          สรุปรายการ
        </h2>

        {items.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">ยังไม่มีรายการบริการ</p>
        ) : (
          <div className="flex flex-col gap-0">
            {items.map((item, i) => {
              const price = prices[item.type]?.[item.btu]
              const size = sizes.find(s => s.btu === item.btu)
              return (
                <div key={item.id} className="flex justify-between items-start py-2 border-b border-black/5 text-sm">
                  <span className="text-ink">
                    {i + 1}. {SERVICE_LABELS[item.type]}
                    <br />
                    <span className="text-muted text-xs">{item.btu.toLocaleString()} BTU ({size?.label})</span>
                  </span>
                  <span className="font-medium text-ink whitespace-nowrap ml-2">
                    {price !== undefined ? `฿${price.toLocaleString()}` : '–'}
                  </span>
                </div>
              )
            })}
            <div className="pt-3 flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-muted">
                <span>ค่าบริการรวม</span><span>฿{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>ค่าเดินทาง</span>
                <span>{travelFee > 0 ? `+฿${travelFee.toLocaleString()}` : 'ฟรี'}</span>
              </div>
              <div className="flex justify-between font-semibold text-ink text-[15px] pt-2 border-t border-black/10 mt-1">
                <span>รวมทั้งหมด</span><span>฿{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price reference table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">อัตราค่าบริการ</p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="text-muted hover:text-ink transition-colors disabled:opacity-40"
            title="โหลดราคาใหม่จาก Google Sheet"
          >
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={refreshing ? 'animate-spin' : ''}
            >
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
        <p className="text-[11px] mb-3" style={{ color: sourceColor }}>{sourceLabel}</p>

        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-muted">
              <th className="text-left pb-1 font-medium">บริการ / ขนาด</th>
              <th className="text-right pb-1 font-medium">ราคา (฿)</th>
            </tr>
          </thead>
          <tbody className="text-ink">
            {Object.entries(SERVICE_LABELS).map(([key, label]) => (
              <>
                <tr key={key + '_h'}>
                  <td colSpan={2} className="pt-2 pb-0.5 font-medium text-muted">{label}</td>
                </tr>
                {sizes.map(s => (
                  <tr key={key + s.btu}>
                    <td className="pl-2 py-0.5 text-muted">{s.btu.toLocaleString()} BTU</td>
                    <td className="text-right py-0.5">
                      {prices[key as keyof typeof prices]?.[s.btu]?.toLocaleString() ?? '–'}
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
