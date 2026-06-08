export interface Feature {
  id: string
  name: string
  desc: string
  icon: React.ComponentType<any>
  color: string
}

export interface Chain {
  id: string
  name: string
  symbol: string
  balance: number
  enabled: boolean
  icon?: React.ComponentType<any>
  color?: string
}

export interface Transaction {
  id: string
  type: 'send' | 'receive' | 'swap'
  amount: number
  from: string
  to: string
  timestamp: number
  status: 'completed' | 'pending' | 'failed'
  chain: string
}

export interface Offer {
  id: string
  title: string
  desc: string
  icon: React.ComponentType<any>
  color?: string
}

export interface Tier {
  id: string
  name: string
  color: string
  icon: React.ComponentType<any>
  benefits: string[]
  monthlyFee?: number
}

export type RenderItemProps<T> = {
  item: T
  index: number
}