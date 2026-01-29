'use client'
import { QRCodeSVG } from 'qrcode.react'
import { useOrder } from '@/context/OrderContext'
import { supabase } from '@/lib/supabase'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'
import { useToast } from './Toast'

interface OrderQRCodeProps {
  tableNumber: string
  restaurantId?: string
  lang?: Lang
  onClose: (opts?: { accepted?: boolean; orderNumber?: string }) => void
}

function generateQrOrderNumber() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  // Generate 8-digit random number for uniqueness
  const rand = Math.floor(Math.random() * 100_000_000)
    .toString()
    .padStart(8, '0')
  // Format: ORD-YYYYMMDD-HHMM-XXXXXXXX
  return `ORD-${y}${m}${day}-${h}${min}-${rand}`
}

export default function OrderQRCode({
  tableNumber,
  restaurantId,
  onClose,
  lang = 'fr',
}: OrderQRCodeProps) {
  const { currentOrder } = useOrder()
  const { showToast } = useToast()
  const qrOrderNumber = useMemo(() => generateQrOrderNumber(), [])
  const hasAcceptedRef = useRef(false)
  const [isListening, setIsListening] = useState(false)

  const notify = (message: string) => {
    // Show custom toast notification
    showToast(message, 'success', 5000)
    
    // Also try browser notification if granted
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('SwipyEat', { body: message })
        }
      }
    } catch {
      // ignore
    }
  }

  // Realtime listener - listens for new orders with matching order_number
  useEffect(() => {
    console.log('🔍 Listening for order:', qrOrderNumber)

    const channel = supabase
      .channel(`order-${qrOrderNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `order_number=eq.${qrOrderNumber}`,
        },
        (payload) => {
          console.log('📦 Order received:', payload)

          if (hasAcceptedRef.current) return

          const newRow = payload?.new
          if (!newRow) return

          const incomingOrderNumber = newRow.order_number || newRow.orderNumber || newRow.number

          if (incomingOrderNumber === qrOrderNumber) {
            console.log('✅ Order matched!')
            hasAcceptedRef.current = true
            setIsListening(false)
            // notify(t(lang, 'order_received_redirect'))
            onClose({ accepted: true, orderNumber: qrOrderNumber })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Listening for order')
          setIsListening(true)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - enable Realtime on "orders" table in Supabase')
          setIsListening(false)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qrOrderNumber, lang, onClose])

  const orderItems = currentOrder?.items ?? []
  const total = currentOrder?.total ?? 0

  const createdAtMs = currentOrder?.createdAt
    ? new Date(currentOrder.createdAt).getTime()
    : 0
  const expSeconds = Math.floor(createdAtMs / 1000) + 2 * 60 * 60

  const orderData = {
    v: '1',
    r: restaurantId,
    t: String(tableNumber),
    o: qrOrderNumber,
    i: orderItems.map((it) => {
      const x = it.selectedModifiers?.length
        ? it.selectedModifiers.map((m) => ({ i: m.modifierId, q: 1 }))
        : undefined
      return {
        m: it.menuItemId,
        ...(it.selectedVariant?.id ? { v: it.selectedVariant.id } : {}),
        ...(x ? { x } : {}),
        q: it.quantity,
        ...(it.specialInstructions?.trim() ? { n: it.specialInstructions.trim() } : {}),
      }
    }),
    e: expSeconds,
  }

  const isRtl = lang === 'ar'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-primary to-orange-500 px-6 py-8 text-center">
          {/* Animated waiting indicator */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className={`absolute inset-0 rounded-full bg-white/20 ${isListening ? 'animate-ping' : ''}`} />
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <span className="text-4xl">{isListening ? '⏳' : '✅'}</span>
            </div>
          </div>
          <p className="text-white font-semibold text-lg">
            {isListening ? t(lang, 'scan_waiter') : t(lang, 'order_received_redirect')}
          </p>
        </div>

        {/* QR Code */}
        <div className="px-6 py-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <QRCodeSVG value={JSON.stringify(orderData)} size={180} level="H" />
          </div>
          
          {/* Order number badge */}
          <div className="mt-4 px-4 py-2 bg-gray-100 rounded-full">
            <span className="text-xs font-mono text-gray-600">{qrOrderNumber}</span>
          </div>
        </div>

        {/* Total */}
        <div className="px-6 pb-6">
          <div className={`flex items-center justify-between py-4 border-t border-dashed border-gray-200 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600 font-medium">{t(lang, 'total')}</span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
              {total.toFixed(0)} DH
            </span>
          </div>

          {/* Back button */}
          <button
            onClick={() => onClose()}
            className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <span>{isRtl ? '→' : '←'}</span>
            <span>{t(lang, 'go_back')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}