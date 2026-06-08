'use client'

import React, { useState } from 'react'
import { useChainbaseSupportedChains } from '@orya/wallet-core'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChainSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (chainId: string) => void
  currentChainId: string
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  open,
  onOpenChange,
  onSelect,
  currentChainId,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: chains, isLoading } = useChainbaseSupportedChains()

  const filteredChains = chains?.filter((chain) =>
    chain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chain.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Chain</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chains..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Chain List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredChains && filteredChains.length > 0 ? (
              <div className="space-y-1 pr-4">
                {filteredChains.map((chain) => {
                  const isSelected = chain.id === currentChainId

                  return (
                    <Button
                      key={chain.id}
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-3',
                        isSelected && 'bg-primary/10'
                      )}
                      onClick={() => {
                        onSelect(chain.id)
                        onOpenChange(false)
                      }}
                    >
                      <div className="flex-1 text-left">
                        <div className="font-medium">{chain.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {chain.symbol}
                          {chain.isTestnet && ' • Testnet'}
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </Button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No chains found
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {!isLoading && filteredChains && (
            <div className="text-center text-sm text-muted-foreground pt-2 border-t">
              {filteredChains.length} chains available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
