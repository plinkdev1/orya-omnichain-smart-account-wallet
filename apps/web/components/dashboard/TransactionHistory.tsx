'use client'
import React, { useState } from 'react'
import { useChainbaseTransactions } from '@orya/wallet-core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

interface TransactionHistoryProps {
  address: string
  chainId: string
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  address,
  chainId,
}) => {
  const [page, setPage] = useState(0)
  const limit = 20
  const { data, isLoading, isFetching } = useChainbaseTransactions({
    address,
    chainId,
    limit,
    offset: page * limit,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data?.transactions.map((transaction) => {
            const isOutgoing =
              transaction.from.toLowerCase() === address.toLowerCase()

            return (
              <div
                key={transaction.hash}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.status === 'confirmed'
                        ? 'bg-green-100'
                        : transaction.status === 'failed'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : transaction.status === 'failed' ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {isOutgoing ? 'Sent' : 'Received'}{' '}
                      {transaction.token?.symbol}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isOutgoing
                        ? `To: ${transaction.to.slice(0, 10)}...`
                        : `From: ${transaction.from.slice(0, 10)}...`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(transaction.timestamp),
                        'MMM dd, yyyy HH:mm'
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold text-sm flex items-center justify-end gap-1 ${
                      isOutgoing ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {isOutgoing ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                    {isOutgoing ? '-' : '+'}
                    {transaction.value}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {transaction.status}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {data?.hasMore && (
          <Button
            onClick={() => setPage(page + 1)}
            disabled={isFetching}
            variant="outline"
            className="w-full mt-4"
          >
            {isFetching ? 'Loading...' : 'Load More'}
          </Button>
        )}

        {data?.transactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
