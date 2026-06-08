import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CHAINBASE_API_KEY = process.env.CHAINBASE_API_KEY || ''
const CHAINBASE_API_URL = 'https://api.chainbase.online/v1/chains'

export async function GET(request: NextRequest) {
  try {
    if (!CHAINBASE_API_KEY) {
      console.warn('CHAINBASE_API_KEY is not set, returning empty chains list')
      return NextResponse.json([])
    }

    const response = await fetch(`${CHAINBASE_API_URL}`, {
      headers: {
        'x-api-key': CHAINBASE_API_KEY,
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      console.error(`Chainbase API error: ${response.status}`)
      return NextResponse.json([], { status: response.status })
    }

    const data = await response.json()

    const chains = (data.data || []).map((chain: any) => ({
      id: chain.chain_id?.toString() || chain.id,
      name: chain.name || chain.chain_name || '',
      symbol: chain.native_currency?.symbol || chain.symbol || '',
      icon: chain.logo_url || '',
      isTestnet: chain.is_testnet === true || chain.chain_type === 'testnet',
      rpcUrl: chain.rpc_url_public || '',
      explorerUrl: chain.block_explorer_url || '',
      nativeDecimals: chain.native_currency?.decimals || 18,
    }))

    return NextResponse.json(chains)
  } catch (error) {
    console.error('Error fetching Chainbase supported chains:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supported chains' },
      { status: 500 }
    )
  }
}
