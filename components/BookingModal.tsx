'use client'

import type { BookingData } from '@/types'

const SERVICE_LABELS: Record<string, string> = {
  wash: 'ล้างแอร์',
  repair: 'ซ่อมแอร์',
  install: 'ติดตั้งแอร์',
}

interface Props {
  data: BookingData
  sizeLabelMap: Record<number, string>
  onClose: () => void
}

function toThaiDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const thaiYear = y + 543
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
  return `${d} ${months[m - 1]} ${thaiYear}`
}

export default function BookingModal({ data, sizeLabelMap, onClose }: Props) {
  const issueDate = toThaiDate(new Date().toISOString().split('T')[0])
  const apptDate = toThaiDate(data.date)

  async function handlePDF() {
    const { default: jsPDF } = await import('jspdf')
    const { default: html2canvas } = await import('html2canvas')
    const el = document.getElementById('print-area')
    if (!el) return
    const canvas = await html2canvas(el, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgW = pageW - 20
    const imgH = (canvas.height * imgW) / canvas.width
    const finalH = Math.min(imgH, pageH - 20)
    pdf.addImage(imgData, 'PNG', 10, 10, imgW, finalH)
    pdf.save(`booking-${data.id}.pdf`)
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-[12px] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div id="print-area" className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">บริการแอร์</h2>
              <p className="text-sm text-muted mt-0.5">ใบยืนยันการจอง / ใบเสนอราคา</p>
            </div>
            <div className="text-right text-sm text-muted">
              <div>วันที่ออก: {issueDate}</div>
            </div>
          </div>

          {/* Booking ID */}
          <div className="bg-[#F1EFE8] rounded-[10px] px-5 py-4 mb-6 text-center">
            <div className="text-xs text-muted font-medium mb-1">หมายเลขการจอง</div>
            <div className="text-2xl font-semibold text-ink tracking-wider">{data.id}</div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-xs text-muted mb-1">ชื่อ-นามสกุล</div>
              <div className="text-sm font-medium text-ink">{data.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">เบอร์โทร</div>
              <div className="text-sm font-medium text-ink">{data.phone}</div>
            </div>
            {data.address && (
              <div className="col-span-2">
                <div className="text-xs text-muted mb-1">ที่อยู่/สถานที่</div>
                <div className="text-sm text-ink">{data.address}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted mb-1">วันนัดหมาย</div>
              <div className="text-sm font-medium text-ink">{apptDate}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">เวลา</div>
              <div className="text-sm font-medium text-ink">{data.time} น.</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-muted mb-1">ระยะทาง</div>
              <div className="text-sm text-ink">{data.distanceLabel}</div>
            </div>
          </div>

          {/* Items table */}
          <div className="mb-6">
            <div className="text-xs font-medium text-muted uppercase tracking-wide mb-2">รายการบริการ</div>
            <div className="border border-[rgba(0,0,0,0.12)] rounded-[8px] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F9F9F7]">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-ink">บริการ</th>
                    <th className="text-left px-4 py-2.5 font-medium text-ink">ขนาด (BTU)</th>
                    <th className="text-right px-4 py-2.5 font-medium text-ink">ราคา</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, i) => (
                    <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                      <td className="px-4 py-2.5 text-ink">{SERVICE_LABELS[item.type]}</td>
                      <td className="px-4 py-2.5 text-ink">{item.btu.toLocaleString()} ({sizeLabelMap[item.btu] || ''})</td>
                      <td className="px-4 py-2.5 text-right text-ink">฿{item.price?.toLocaleString() ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost summary */}
          <div className="summary-card">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink">
                <span>ค่าบริการรวม</span>
                <span>฿{data.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-ink">
                <span>ค่าเดินทาง ({data.distanceLabel})</span>
                <span>฿{data.travelFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-[rgba(0,0,0,0.12)] pt-2 flex justify-between font-semibold text-[15px] text-ink">
                <span>รวมทั้งสิ้น</span>
                <span>฿{data.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-8 pb-8 justify-end">
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            <span className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              พิมพ์
            </span>
          </button>
          <button type="button" className="btn-secondary" onClick={handlePDF}>
            <span className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              ดาวน์โหลด PDF
            </span>
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>เสร็จสิ้น</button>
        </div>
      </div>
    </div>
  )
}
