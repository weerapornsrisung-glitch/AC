export interface SizeOption {
  btu: number
  label: string
}

export interface DistanceOption {
  label: string
  fee: number
}

export interface Prices {
  wash: Record<number, number>
  repair: Record<number, number>
  install: Record<number, number>
}

export interface PricingData {
  sizes: SizeOption[]
  prices: Prices
  distanceOptions: DistanceOption[]
  source: {
    rate: boolean
    travel: boolean
  }
}

export interface ServiceItem {
  id: string
  type: 'wash' | 'repair' | 'install'
  btu: number
  price?: number
}

export interface BookingData {
  id: string
  name: string
  phone: string
  address: string
  date: string
  time: string
  distanceLabel: string
  travelFee: number
  items: ServiceItem[]
  subtotal: number
  total: number
}
