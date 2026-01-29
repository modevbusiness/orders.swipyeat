'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { CartItem } from '@/types'

export type OrderStatus = 'preparation' | 'ready' | 'paid' | 'served' | 'cancelled'

export interface Order {
  id: string
  orderNumber: string
  tableNumber: string
  items: CartItem[]
  status: OrderStatus
  createdAt: string
  subtotal: number
  serviceFee: number
  total: number
}

interface OrderContextType {
  currentOrder: Order | null
  createOrder: (tableNumber: string, items: CartItem[], subtotal: number, serviceFee: number, total: number) => void
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  clearOrder: () => void
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)

  const generateOrderNumber = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    // Generate 2 random letters
    const letter1 = letters[Math.floor(Math.random() * letters.length)]
    const letter2 = letters[Math.floor(Math.random() * letters.length)]
    // Generate 4-digit number
    const numbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    // Generate 4 random alphanumeric characters
    const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    // Format: XX-0000-XXXX (e.g., AB-1234-K7M2)
    return `${letter1}${letter2}-${numbers}-${suffix}`
  }

  const createOrder = (
    tableNumber: string,
    items: CartItem[],
    subtotal: number,
    serviceFee: number,
    total: number
  ) => {
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: generateOrderNumber(),
      tableNumber,
      items,
      status: 'preparation',
      createdAt: new Date().toISOString(),
      subtotal,
      serviceFee,
      total,
    }
    setCurrentOrder(newOrder)
  }

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setCurrentOrder((prev) => {
      if (prev && prev.id === orderId) {
        return { ...prev, status }
      }
      return prev
    })
  }

  const clearOrder = () => {
    setCurrentOrder(null)
  }

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        createOrder,
        updateOrderStatus,
        clearOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  )
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider')
  }
  return context
}
