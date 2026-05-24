import { NextResponse } from 'next/server'
import { fetchPricing } from '@/lib/sheets'

export const dynamic = 'force-dynamic'

export async function GET() {
  const pricing = await fetchPricing()
  return NextResponse.json(pricing)
}
