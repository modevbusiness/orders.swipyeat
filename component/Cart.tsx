'use client'

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useOrder } from '@/context/OrderContext'
import OrderQRCode from './OrderQRCode'
import EditCartItemModal from './EditCartItemModal'
import { supabase } from '@/lib/supabase'
import { MenuItem, CartItem } from '@/types'
import { ArrowLeftIcon, ReceiptText, Trash2 } from 'lucide-react'
import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'


interface CartProps {
  onClose?: () => void
  tableNumber?: string
  restaurantSlug?: string
  restaurantId?: string
  lang?: Lang
}

// Helper to get the correct name based on language
const getLocalizedName = (
  item: { menuItemName: string; menuItemName_ar?: string | null; menuItemName_fr?: string | null },
  lang: Lang
): string => {
  if (lang === 'ar' && item.menuItemName_ar) return item.menuItemName_ar
  if (lang === 'fr' && item.menuItemName_fr) return item.menuItemName_fr
  return item.menuItemName // default (English or fallback)
}

// Helper for modifier names
const getLocalizedModifierName = (
  mod: { modifierName: string; modifierName_ar?: string | null; modifierName_fr?: string | null },
  lang: Lang
): string => {
  if (lang === 'ar' && mod.modifierName_ar) return mod.modifierName_ar
  if (lang === 'fr' && mod.modifierName_fr) return mod.modifierName_fr
  return mod.modifierName
}

export default function Cart({ onClose, tableNumber, restaurantSlug, restaurantId, lang = 'fr' }: CartProps) {
  const router = useRouter()
  const isRtl = lang === 'ar'
  const {
    items,
    updateItem,
    removeItem,
    clearCart,
    getSubtotal,
    getServiceFee,
    getTotal,
  } = useCart()
  const { createOrder, currentOrder } = useOrder()
  console.log("restaurantId :", items)


  useEffect( () => {
    console.log("useEffect")
    const channel = supabase
      .channel('kitchen-alertss')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log(payload)
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  const [showQRCode, setShowQRCode] = useState(false)
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [menuItemForEdit, setMenuItemForEdit] = useState<MenuItem | null>(null)
  const [isLoadingMenuItem, setIsLoadingMenuItem] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<CartItem | null>(null)

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      const toRemove = items.find((it) => it.id === id) ?? null
      setPendingRemove(toRemove)
    } else {
      updateItem(id, { quantity: newQuantity })
    }
  }

  const handlePlaceOrder = () => {
    if (items.length === 0 || !tableNumber) return
    // Create order
    createOrder(tableNumber, items, getSubtotal(), getServiceFee(), getTotal())
    setShowQRCode(true)
    // Immediately clear cart (also clears localStorage)
    // clearCart()
  }

  const formatCustomizations = (item: typeof items[0]) => {
    const parts: string[] = []
    if (item.selectedVariant) {
      // Use localized variant name
      const variantName = lang === 'ar' && item.selectedVariant.name_ar 
        ? item.selectedVariant.name_ar 
        : lang === 'fr' && item.selectedVariant.name_fr 
          ? item.selectedVariant.name_fr 
          : item.selectedVariant.name
      parts.push(variantName)
    }
    if (item.removedModifiers?.length) {
      const names = item.removedModifiers.map((m) => getLocalizedModifierName(m, lang)).filter(Boolean)
      if (names.length)
        parts.push(
          `${t(lang, 'no_prefix')} ${names.slice(0, 2).join(', ')}${names.length > 2 ? '…' : ''}`
        )
    }
    if (item.specialInstructions) {
      parts.push(item.specialInstructions)
    }
    return parts.join(', ')
  }

  console.log("items :", items)
  const handleEditItem = async (cartItem: CartItem) => {
    setIsLoadingMenuItem(true)
    try {
      // Fetch menu item details
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', cartItem.menuItemId)
        .single()

      if (error) throw error
      if (data) {
        setMenuItemForEdit(data as MenuItem)
        setEditingItem(cartItem)
      }
    } catch (err) {
      console.error('Error fetching menu item:', err)
    } finally {
      setIsLoadingMenuItem(false)
    }
  }

  console.log("items[0].restaurantId :", items[0]?.restaurantId)

    return (
    <>
      {showQRCode && tableNumber && (
        <OrderQRCode
          tableNumber={tableNumber}
          restaurantId={items[0]?.restaurantId}
          lang={lang}
          onClose={(opts) => {
            setShowQRCode(false)

            // Only redirect once the order is actually inserted/accepted in Supabase.
            if (opts?.accepted && opts?.orderNumber) {
            clearCart()
            if (restaurantSlug && tableNumber) {
                const href = `/${restaurantSlug}/${tableNumber}/track-order?orderNumber=${encodeURIComponent(opts.orderNumber)}&restaurantId=${encodeURIComponent(items[0]?.restaurantId || '')}&lang=${lang}`
                router.push(href)
            } else if (onClose) {
              onClose()
              }
            }
          }}
        />
      )}
      {editingItem && menuItemForEdit && (
        <EditCartItemModal
          cartItem={editingItem}
          menuItem={menuItemForEdit}
          lang={lang}
          isOpen={!!editingItem}
          onClose={() => {
            setEditingItem(null)
            setMenuItemForEdit(null)
          }}
        />
      )}
      {pendingRemove && (
        <div
          className="fixed inset-0 z-50 bg-white flex items-center justify-center p-4"
          onClick={() => setPendingRemove(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-start justify-between gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  {t(lang, 'remove_item_title')}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t(lang, 'remove_item_body', { item: getLocalizedName(pendingRemove, lang) })}
                </p>
              </div>
              <button
                onClick={() => setPendingRemove(null)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                aria-label={t(lang, 'close')}
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setPendingRemove(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                {t(lang, 'cancel')}
              </button>
              <button
                onClick={() => {
                  removeItem(pendingRemove.id)
                  setPendingRemove(null)
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                {t(lang, 'remove')}
              </button>
            </div>
          </div>
        </div>
      )}
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className={`max-w-4xl mx-auto px-4 py-4 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-2xl font-bold">{t(lang, 'cart_title')}</h1>
          </div>
          {items?.length > 0 && (
            <button
              onClick={clearCart}
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              {t(lang, 'clear_all')}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            {/* Empty cart illustration */}
            <div className="relative w-32 h-32 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-orange-500/10 rounded-full animate-pulse" />
              <div className="absolute inset-4 bg-white rounded-full shadow-inner flex items-center justify-center">
                <span className="text-5xl">🛒</span>
              </div>
            </div>
            <p className="text-gray-800 text-xl font-bold mb-2">{t(lang, 'empty_cart_title')}</p>
            <p className="text-gray-500 text-sm text-center max-w-xs">
              {t(lang, 'empty_cart_subtitle')}
            </p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3 mb-6">
              {items.map((cartLine) => (
                    <div
                      key={cartLine.id}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
                >
                  {/* Main content row */}
                  <div className="flex gap-3">
                    {/* Image */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      {cartLine.imageUrl ? (
                      <img
                          src={cartLine.imageUrl}
                          alt={getLocalizedName(cartLine, lang)}
                          className="w-full h-full object-cover"
                      />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-[10px]">{t(lang, 'no_image')}</span>
                      </div>
                    )}
                  </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name & Price */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                          {getLocalizedName(cartLine, lang)}
                      </h3>
                        <span className="text-primary font-bold text-base whitespace-nowrap">
                          {cartLine.totalPrice} DH
                      </span>
                    </div>

                    {/* Customizations */}
                      {formatCustomizations(cartLine) && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {formatCustomizations(cartLine)}
                      </p>
                    )}

                      {/* Quantity */}
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-500">{t(lang, 'subtotal')}:</span>
                        <span className="text-xs font-medium text-gray-700">×{cartLine.quantity}</span>
                      </div>
                        </div>
                        </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    {/* Quantity stepper */}
                    <div className="flex items-center gap-0 bg-gray-100 rounded-lg overflow-hidden">
                        <button
                        onClick={() => handleQuantityChange(cartLine.id, cartLine.quantity - 1)}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors text-xl font-medium"
                            aria-label={t(lang, 'decrease_quantity')}
                        >
                        −
                        </button>
                      <span className="w-10 h-10 flex items-center justify-center font-bold text-gray-900 bg-white border-x border-gray-200">
                            {cartLine.quantity}
                        </span>
                        <button
                        onClick={() => handleQuantityChange(cartLine.id, cartLine.quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary/10 active:bg-primary/20 transition-colors text-xl font-medium"
                            aria-label={t(lang, 'increase_quantity')}
                        >
                          +
                        </button>
                      </div>
                        
                    {/* Edit & Delete */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleEditItem(cartLine)}
                          disabled={isLoadingMenuItem}
                        className="h-10 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm inline-flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <ReceiptText className="w-4 h-4" />
                            <span>{t(lang, 'edit')}</span>
                        </button>
                        <button
                            onClick={() => setPendingRemove(cartLine)}
                        className="w-10 h-10 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                            aria-label={t(lang, 'remove_item')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Frequently Bought Together Section */}
            {/* <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">
                Frequently bought together
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                  <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden">
                    <div className="w-full h-full bg-yellow-100 flex items-center justify-center">
                      <span className="text-4xl">🍋</span>
                    </div>
                  </div>
                  <h3 className="font-bold mb-1">Iced Lemonade</h3>
                  <p className="text-green-600 font-bold mb-2">+$3.50</p>
                  <button className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 rounded-lg transition-colors">
                    {t(lang, 'add')}
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                  <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden">
                    <div className="w-full h-full bg-amber-100 flex items-center justify-center">
                      <span className="text-4xl">🍫</span>
                    </div>
                  </div>
                  <h3 className="font-bold mb-1">Chocolate Dip</h3>
                  <p className="text-green-600 font-bold mb-2">+$1.00</p>
                  <button className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 rounded-lg transition-colors">
                    {t(lang, 'add')}
                  </button>
                </div>
              </div>
            </div> */}

           

            {/* Order Summary */}
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] p-6 mb-6">
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <h2 className={`text-xl font-bold mb-5 ${isRtl ? 'text-right' : ''}`}>{t(lang, 'order_summary')}</h2>
              
              <div className="space-y-3 relative">
                <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-500 font-medium">{t(lang, 'subtotal')}</span>
                  <span className="text-gray-700 font-semibold">{getSubtotal().toFixed(0)} DH</span>
                </div>
              
                <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-500 font-medium">{t(lang, 'service_fee')}</span>
                  <span className="text-emerald-600 font-semibold">0 DH</span>
                </div>
               
                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 my-4" />
                
                <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-900 font-bold text-lg">{t(lang, 'total')}</span>
                  <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                    {getTotal().toFixed(0)} DH
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer with Total and Place Order Button */}
      {items?.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.1)]">
          <div className={`max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={isRtl ? 'text-right' : ''}>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t(lang, 'total_payable')}</p>
              <p className="text-2xl font-extrabold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                {getTotal().toFixed(0)} DH
              </p>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={!tableNumber}
              className="group relative overflow-hidden bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-3.5 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98]"
            >
              <span className="relative z-10">
                {t(lang, 'place_order')}
              </span>
              <span className={`relative z-10 transition-transform group-hover:${isRtl ? '-translate-x-1' : 'translate-x-1'}`}>
                {isRtl ? '←' : '→'}
              </span>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </div>
        </div>
      )}
    </div>
    </>
    )
}
