import { fetchPricing } from '@/lib/sheets'
import BookingForm from '@/components/BookingForm'

export default async function Page() {
  const initialPricing = await fetchPricing()
  return (
    <main className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-[23px] font-semibold text-ink">ระบบจองบริการแอร์</h1>
        <p className="text-sm text-muted mt-1">คำนวณค่าบริการและจองนัดหมาย</p>
      </div>
      <BookingForm initialPricing={initialPricing} />
    </main>
  )
}
