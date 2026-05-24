'use client'

import { useState } from 'react'
import type { PricingData, ServiceItem, BookingData } from '@/types'
import ServiceItemRow from './ServiceItemRow'
import SummarySidebar from './SummarySidebar'
import BookingModal from './BookingModal'

function newItem(btu: number): ServiceItem {
  return { id: Math.random().toString(36).slice(2), type: 'wash', btu }
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function randId() {
  const d = new Date()
  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const r = Math.floor(Math.random() * 9000 + 1000)
  return `AC${yy}${mm}${dd}-${r}`
}

interface Props {
  initialPricing: PricingData
}

export default function BookingForm({ initialPricing }: Props) {
  const [pricing, setPricing] = useState<PricingData>(initialPricing)
  const [refreshing, setRefreshing] = useState(false)

  const defaultBtu = pricing.sizes[0]?.btu ?? 9000
  const [items, setItems] = useState<ServiceItem[]>([newItem(defaultBtu)])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [date, setDate] = useState(todayStr())
  const [time, setTime] = useState('09:00')
  const [distIdx, setDistIdx] = useState(0)
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [error, setError] = useState('')

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/pricing')
      if (res.ok) {
        const data: PricingData = await res.json()
        setPricing(data)
      }
    } catch {}
    setRefreshing(false)
  }

  function handleItemChange(id: string, field: 'type' | 'btu', value: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [field]: field === 'btu' ? Number(value) : value as ServiceItem['type'] }
          : item
      )
    )
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function handleAddItem() {
    setItems((prev) => [...prev, newItem(pricing.sizes[0]?.btu ?? 9000)])
  }

  function handleReset() {
    setItems([newItem(pricing.sizes[0]?.btu ?? 9000)])
    setName('')
    setPhone('')
    setAddress('')
    setDate(todayStr())
    setTime('09:00')
    setDistIdx(0)
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('กรุณากรอกชื่อ-นามสกุล'); return }
    if (!phone.trim()) { setError('กรุณากรอกเบอร์โทร'); return }
    if (!date) { setError('กรุณาเลือกวันที่'); return }
    if (!time) { setError('กรุณาเลือกเวลา'); return }
    if (items.length === 0) { setError('กรุณาเพิ่มรายการบริการอย่างน้อย 1 รายการ'); return }
    setError('')

    const dist = pricing.distanceOptions[distIdx]
    const travelFee = dist?.fee ?? 0
    const subtotal = items.reduce((s, item) => s + (pricing.prices[item.type]?.[item.btu] ?? 0), 0)
    const total = subtotal + travelFee

    const enrichedItems = items.map((item) => ({
      ...item,
      price: pricing.prices[item.type]?.[item.btu] ?? 0,
    }))

    setBooking({
      id: randId(),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      date,
      time,
      distanceLabel: dist?.label ?? '',
      travelFee,
      items: enrichedItems,
      subtotal,
      total,
    })
  }

  const sizeLabelMap = Object.fromEntries(pricing.sizes.map((s) => [s.btu, s.label]))

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: form */}
        <form onSubmit={handleSubmit} className="flex-[2] space-y-6">
          {/* Service items */}
          <div className="card">
            <h2 className="text-[18px] font-semibold text-ink mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
              </svg>
              รายการบริการ
            </h2>
            <div className="space-y-3">
              <div className="hidden sm:flex gap-3 text-xs font-medium text-muted px-0">
                <span className="flex-1">ประเภทบริการ</span>
                <span className="flex-1">ขนาด</span>
                <span className="w-24 text-right">ราคา</span>
                <span className="w-8" />
              </div>
              {items.map((item) => (
                <ServiceItemRow
                  key={item.id}
                  item={item}
                  sizes={pricing.sizes}
                  prices={pricing.prices}
                  onChange={handleItemChange}
                  onDelete={handleDelete}
                  showDelete={items.length > 1}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-4 flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              เพิ่มรายการ
            </button>
          </div>

          {/* Customer info */}
          <div className="card">
            <h2 className="text-[18px] font-semibold text-ink mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              ข้อมูลลูกค้า
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                <input type="text" className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อ-นามสกุลลูกค้า" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">เบอร์โทร <span className="text-red-500">*</span></label>
                <input type="tel" className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0xx-xxx-xxxx" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">ที่อยู่/สถานที่</label>
                <input type="text" className="field-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ที่อยู่หรือสถานที่ให้บริการ" />
              </div>
            </div>
          </div>

          {/* Date / time / distance */}
          <div className="card">
            <h2 className="text-[18px] font-semibold text-ink mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              วันเวลาและระยะทาง
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">วันที่ <span className="text-red-500">*</span></label>
                <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">เวลา <span className="text-red-500">*</span></label>
                <input type="time" className="field-input" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">ระยะทาง</label>
                <select className="field-input" value={distIdx} onChange={(e) => setDistIdx(Number(e.target.value))}>
                  {pricing.distanceOptions.map((opt, i) => (
                    <option key={i} value={i}>{opt.label}{opt.fee > 0 ? ` (+฿${opt.fee})` : ' (ฟรี)'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit row */}
          <div className="flex gap-3 justify-end">
            <button type="button" className="btn-secondary" onClick={handleReset}>ล้างข้อมูล</button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              คำนวณและยืนยันการจอง
            </button>
          </div>
        </form>

        {/* Right: sidebar */}
        <div className="lg:w-80 xl:w-96">
          <SummarySidebar
            items={items}
            selectedDistIdx={distIdx}
            pricing={pricing}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        </div>
      </div>

      {booking && (
        <BookingModal
          data={booking}
          sizeLabelMap={sizeLabelMap}
          onClose={() => setBooking(null)}
        />
      )}
    </>
  )
}
