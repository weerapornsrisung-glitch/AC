'use client'

import { useRef } from 'react'
import type { BookingData, PricingData, ServiceKey } from '@/types'

const SERVICE_LABELS: Record<ServiceKey, string> = {
  wash:    'ล้างแอร์',
  repair:  'ซ่อมแอร์',
  install: 'ติดตั้งแอร์',
}

const TH_MONTHS = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function thDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${TH_MONTHS[m]} ${y + 543}`
}

interface Props {
  data: BookingData
  pricing: PricingData
  onClose: () => void
}

export default function BookingModal({ data, pricing, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const now = new Date()
  const issuedDate = `${now.getDate()} ${TH_MONTHS[now.getMonth() + 1]} ${now.getFullYear() + 543}`

  const handlePDF = async () => {
    if (!printRef.current) return
    const btn = document.getElementById('pdf-btn') as HTMLButtonElement | null
    if (btn) { btn.textContent = 'กำลังสร้าง...'; btn.disabled = true }
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff', logging: false })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const w = pdf.internal.pageSize.getWidth()
      const h = (canvas.height * w) / canvas.width
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, Math.min(h, pdf.internal.pageSize.getHeight()))
      pdf.save(`ใบเสนอราคา-${data.id}.pdf`)
    } catch (e) {
      console.error(e)
      alert('ไม่สามารถสร้าง PDF ได้')
    }
    if (btn) { btn.textContent = 'ดาวน์โหลดใบเสนอราคา PDF'; btn.disabled = false }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent rounded-[10px] p-2.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div>
              <p className="text-[18px] font-semibold text-ink">จองสำเร็จ!</p>
              <p className="text-[13px] text-muted">กรุณาบันทึกหมายเลขการจอง</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <hr className="border-black/[0.08] my-4" />

        {/* Printable / PDF content */}
        <div ref={printRef} style={{ fontFamily: 'Inter, "Noto Sans Thai", sans-serif' }}>

          {/* PDF header (visible in PDF/print only) */}
          <div className="flex justify-between items-start mb-4 pb-4 border-b border-black/10">
            <div>
              <p className="font-semibold text-ink text-base">บริการแอร์</p>
              <p className="text-xs text-muted">ล้าง • ซ่อม • ติดตั้ง ครบวงจร</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">ออกเมื่อ {issuedDate}</p>
            </div>
          </div>

          {/* Booking ID */}
          <div className="bg-accent rounded-[10px] p-4 mb-4 text-center">
            <p className="text-xs text-muted mb-1">หมายเลขการจอง</p>
            <p className="text-[22px] font-semibold tracking-wide text-ink">{data.id}</p>
          </div>

          {/* Customer info */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">ข้อมูลลูกค้า</p>
            <div className="grid grid-cols-2 gap-y-1.5 text-sm">
              <span className="text-muted">ชื่อ</span>
              <span className="text-right font-medium text-ink">{data.name}</span>
              <span className="text-muted">โทร</span>
              <span className="text-right font-medium text-ink">{data.phone}</span>
              {data.address && <>
                <span className="text-muted">ที่อยู่</span>
                <span className="text-right text-ink">{data.address}</span>
              </>}
              <span className="text-muted">วันนัด</span>
              <span className="text-right font-medium text-ink">{thDate(data.date)} เวลา {data.time} น.</span>
              <span className="text-muted">ระยะทาง</span>
              <span className="text-right text-ink">{data.distanceLabel}</span>
            </div>
          </div>

          <hr className="border-black/[0.08] my-4" />

          {/* Items */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">รายการบริการ</p>
            <div className="flex flex-col gap-1.5">
              {data.items.map(item => {
                const size = pricing.sizes.find(s => s.key === item.sizeKey)
                return (
                  <div key={item.id} className="flex justify-between items-center text-sm py-1.5 border-b border-black/[0.06]">
                    <div>
                      <span className="badge mr-2">{SERVICE_LABELS[item.type]}</span>
                      <span className="text-muted text-xs">{size?.label ?? item.sizeKey}</span>
                    </div>
                    <span className="font-medium text-ink">
                      {item.price !== undefined ? `฿${item.price.toLocaleString()}` : '–'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <hr className="border-black/[0.08] my-4" />

          {/* Cost summary */}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>ค่าบริการรวม ({data.items.length} รายการ)</span>
              <span>฿{data.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>ค่าเดินทาง ({data.distanceLabel})</span>
              <span>{data.travelFee > 0 ? `฿${data.travelFee.toLocaleString()}` : 'ฟรี'}</span>
            </div>
            <div className="flex justify-between text-[16px] font-semibold text-ink pt-2 border-t-2 border-ink mt-1">
              <span>ยอดรวมสุทธิ</span>
              <span>฿{data.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={() => window.print()}
            className="btn-secondary flex items-center gap-1.5 flex-none">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            พิมพ์
          </button>
          <button id="pdf-btn" type="button" onClick={handlePDF}
            className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            ดาวน์โหลดใบเสนอราคา PDF
          </button>
          <button type="button" onClick={onClose} className="btn-primary flex-none">เสร็จสิ้น</button>
        </div>
      </div>
    </div>
  )
}
