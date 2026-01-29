'use client'

import { MenuItem, CartItem } from '@/types'
import { useCart } from '@/context/CartContext'
import { useEffect, useMemo, useState } from 'react'
import EditCartItemModal from '@/component/EditCartItemModal'
import { Clock, ReceiptText } from 'lucide-react'
import { pickName, type Lang } from '@/lib/i18n'
import { pickDescription } from '@/lib/i18n'
import { t } from '@/lib/i18n'

const Item = ({
  item,
  handleOpenModal,
  onOverlayChange,
  lang,
}: {
  item: MenuItem
  handleOpenModal: (item: MenuItem) => void
  onOverlayChange?: (open: boolean) => void
  lang: Lang
}) => {

  const { addItem, items: cartItems } = useCart()
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null)
  const displayName = pickName(lang, item)
  const displayDescription = pickDescription(lang, {
    description: item.description,
    description_ar: item.description_ar,
  })
  const isRtl = lang === 'ar'
  const prepTime = typeof item.preparation_time === 'number' ? item.preparation_time : 0
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setHasMounted(true), 0)
    return () => clearTimeout(id)
  }, [])

  const matchingCartItems = useMemo(
    () => cartItems.filter((ci) => ci.menuItemId === item.id),
    [cartItems, item.id]
  )
  const isAdded = hasMounted && matchingCartItems.length > 0
  const primaryCartItem = matchingCartItems[0] ?? null
  const totalQtyInCart = useMemo(
    () => matchingCartItems.reduce((sum, ci) => sum + (ci.quantity || 0), 0),
    [matchingCartItems]
  )

    return (
        <>
        {editingCartItem && (
          <EditCartItemModal
            cartItem={editingCartItem}
            menuItem={item}
            lang={lang}
            isOpen={!!editingCartItem}
            onClose={() => {
              setEditingCartItem(null)
              onOverlayChange?.(false)
            }}
          />
        )}
        <div
                onClick={(e)=>{
                    // Only open the details modal when clicking on the card itself
                    if ((e.target as HTMLElement).closest('button')) return
                    handleOpenModal(item)
                }}
                className={`group p-3 min-h-[136px] border border-gray-100 relative flex md:flex-col ${
                  isRtl ? 'flex-row-reverse' : 'flex-row'
                } gap-4 overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:border-orange-100 transition-all duration-300 active:scale-[0.98] cursor-pointer`}
                >
                {/* Image */}
                <div className="relative h-[108px] w-[130px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                  {item.image_url ? (
                    <>
                      <img
                        src={item.image_url}
                        alt={displayName}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/10" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-semibold text-gray-400">
                      <span className="text-3xl mb-1">🍽️</span>
                      {t(lang, 'no_image')}
                    </div>
                  )}

                  {/* Preparation time badge (circular) */}
                  {prepTime > 0 && (
                    <div
                      className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[11px] font-extrabold text-gray-900 shadow-sm backdrop-blur`}
                    >
                      <div className="flex flex-col items-center leading-none">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-700" />
                        </span>
                        <span className="mt-0.5">
                          {prepTime}
                          {t(lang, 'min_short')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Image */}
                {/* {item ? (
           
                ) : (
                  <div className="bg-gradient-to-br from-gray-200 h-[100px] w-[100px] to-gray-300 h-full flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )} */}

                {/* Content */}
                <div className="text-left flex-1 flex justify-between flex-col min-w-0">
                 <div>
                 <div className={`w-full flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <h3 className="font-extrabold text-[16px] leading-snug text-gray-900 mb-1 truncate">
                    {displayName}
                  </h3>
                  {isAdded && (
                    <span className="text-xs font-extrabold bg-white border-2 border-primary text-primary px-2 py-1 rounded-full shadow-sm">
                       ×{totalQtyInCart}
                    </span>
                  )}
                
                  </div>
                 

                  <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">
                    {displayDescription}
                  </p>
                 
                 </div>

                 
                  {/* Footer */}
                  <div className="border-t border-gray-100 pt-2">
                   
                    <div className={`flex justify-between items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[15px] font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                        {item.base_price} DH
                      </span>
                      {isAdded && primaryCartItem ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCartItem(primaryCartItem)
                            onOverlayChange?.(true)
                          }}
                          className="inline-flex items-center gap-2 rounded-full bg-white text-primary border-2 border-primary/30 shadow-sm hover:shadow-md hover:border-primary/50 active:scale-[0.99] px-4 py-2 font-extrabold text-sm transition-all"
                        >
                          <ReceiptText className="w-4 h-4" />
                          {/* Arabic-first button label */}
                          {lang === 'ar' ? 'تعديل' : t(lang, 'edit')}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const hasModifiers = (item.menu_item_modifiers?.length ?? 0) > 0
                            const hasVariants =
                              (item.item_variants?.some((v) => v.is_available !== false) ?? false)

                            // If the item has variants/modifiers, open the chooser modal.
                            // Otherwise, add directly to cart.
                            if (hasModifiers || hasVariants) {
                              handleOpenModal(item)
                            } else {
                            addItem(item)
                            }
                          }}
                          className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200/50 hover:shadow-lg hover:shadow-orange-300/50 hover:scale-105 active:scale-[0.97] px-4 py-2 font-extrabold text-sm transition-all duration-200"
                        >
                          + {t(lang, 'add')}
                        </button>
                      )}
                   
                    </div>
                  </div>
                </div>
              </div>
        </>
    )
}

export default Item
