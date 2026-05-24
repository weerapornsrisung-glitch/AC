export interface SizeOption {
  key: string
  label: string
}

export interface DistanceOption {
  label: string
  fee: number
}

export type ServiceKey = 'wash' | 'repair' | 'install'

export interface Prices {
  wash: Record<string, number>
  repair: Record<string, number>
  install: Record<string, number>
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
  type: ServiceKey
  sizeKey: string
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
