'use client'

/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from 'react'
import { CartItem, Modifier, ItemVariant, MenuItem } from '@/types'
import { useMenuItemDetails } from '@/hooks/useMenuItemDetails'
import { useCart } from '@/context/CartContext'
import { ChevronLeft, ChevronRight, Clock, ReceiptText } from 'lucide-react'
import type { Lang } from '@/lib/i18n'
import { pickDescription, pickName } from '@/lib/i18n'
import { t } from '@/lib/i18n'
import EditCartItemModal from '@/component/EditCartItemModal'


interface MenuItemModalProps {
  item: MenuItem
  lang: Lang
  isOpen: boolean
  onClose: () => void
  relatedItems?: MenuItem[]
  onSelectItem?: (item: MenuItem) => void
}

export default function MenuItemModal({
  item,
  lang,
  isOpen,
  onClose,
  relatedItems = [],
  onSelectItem,
}: MenuItemModalProps) {
  const { addItem, items: cartItems } = useCart()
  const { variants, modifiers, loading } = useMenuItemDetails(item.id)

  const displayItemName = pickName(lang, item)
  const displayDescription = pickDescription(lang, {
    description: item.description,
    description_ar: item.description_ar,
  })

  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null)
  // Paid extras selected (price > 0)
  const [addModifierIds, setAddModifierIds] = useState<Set<string>>(() => new Set())
  // Free ingredients the user wants removed (price === 0)
  const [removeModifierIds, setRemoveModifierIds] = useState<Set<string>>(() => new Set())
  const [showSelectedExtras, setShowSelectedExtras] = useState(true)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null)
  const [variantError, setVariantError] = useState(false)
  const [isImageOpen, setIsImageOpen] = useState(false)
  const variantsRef = useRef<HTMLDivElement | null>(null)

  const matchingCartItems = useMemo(
    () => cartItems.filter((ci) => ci.menuItemId === item.id),
    [cartItems, item.id]
  )
  const totalQtyInCart = useMemo(
    () => matchingCartItems.reduce((sum, ci) => sum + (ci.quantity || 0), 0),
    [matchingCartItems]
  )

  if (!isOpen) return null

  // Calculate total price
  const variantPrice = selectedVariant?.price_adjustment || 0
  const modifiersPrice = Array.from(addModifierIds).reduce((sum, id) => {
    const price = modifiers.find((m) => m.id === id)?.price ?? 0
    return sum + price
  }, 0)
  const itemTotal = (item.base_price + variantPrice + modifiersPrice) * quantity

  const setModifierChoice = (modifier: Modifier, choice: 'with' | 'without') => {
    const id = modifier.id
    setShowSelectedExtras(true)

    if (modifier.price === 0) {
      // Free ingredient: With default; Without => add to remove list
      if (choice === 'without') setRemoveModifierIds((prev) => new Set(prev).add(id))
      else
        setRemoveModifierIds((prev) => {
          if (!prev.has(id)) return prev
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      // ensure it's not treated as paid extra
      setAddModifierIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      return
    }

    // Paid extra: With => add; Without => not added
    if (choice === 'with') setAddModifierIds((prev) => new Set(prev).add(id))
    else
      setAddModifierIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    // paid extras should not be in remove list
    setRemoveModifierIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedVariant) {
      setVariantError(true)
      variantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setVariantError(false)

    addItem({
      menuItemId: item.id,
      menuItemName: item.name,
      menuItemName_ar: item.name_ar,
      menuItemName_fr: item.name_fr,
      imageUrl: item.image_url,
      restaurantId: item.restaurant_id,
      quantity,
      base_price: item.base_price,
      selectedVariant: selectedVariant
        ? {
            id: selectedVariant.id,
            name: selectedVariant.name,
            name_ar: selectedVariant.name_ar,
            name_fr: selectedVariant.name_fr,
            priceAdjustment: selectedVariant.price_adjustment,
          }
        : undefined,
      selectedModifiers: modifiers
        .filter((m) => m.price > 0 && addModifierIds.has(m.id))
        .map((m) => ({
          modifierId: m.id,
          modifierName: m.name,
          modifierName_ar: m.name_ar,
          modifierName_fr: m.name_fr,
          price: m.price,
        })),
      removedModifiers: modifiers
        .filter((m) => m.price === 0 && removeModifierIds.has(m.id))
        .map((m) => ({
          modifierId: m.id,
          modifierName: m.name,
          modifierName_ar: m.name_ar,
          modifierName_fr: m.name_fr,
        })),
      specialInstructions: specialInstructions || undefined,
    })
    onClose()
  }


  const handleSelectVariant = (variant: ItemVariant) => {
    setSelectedVariant(selectedVariant?.id === variant.id ? null : variant)
    setVariantError(false)
  }

  
  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 bg-white bg-opacity-50 z-1111 min-h-screen pb-[100px] overflow-y-auto"
      onClick={onClose}
    >
      {editingCartItem && (
        <EditCartItemModal
          cartItem={editingCartItem}
          menuItem={item}
          isOpen={!!editingCartItem}
          onClose={() => setEditingCartItem(null)}
        />
      )}
      <div
        className="relative min-h-screen"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Item Image - Full Screen Top */}
        <div className="fixed top-0  h-[30vh]  w-full">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={displayItemName}
              className="object-cover w-full h-full cursor-zoom-in"
              onClick={(e) => {
                e.stopPropagation()
                setIsImageOpen(true)
              }}
            />
          ) : (
            <div className="bg-linear-to-br  from-gray-200 to-gray-300 h-full flex items-center justify-center">
              <span className="text-gray-500">{t(lang, 'no_image')}</span>
            </div>
          )}

          {typeof item.preparation_time === 'number' && item.preparation_time > 0 && (
            <div
              className={`absolute top-5 ${lang === 'ar' ? 'left-5' : 'right-5'} z-10 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-gray-900 shadow-sm backdrop-blur`}
            >
              <span>{item.preparation_time}{t(lang, 'min_short')}</span>
              <Clock className="h-4 w-4 text-gray-700" />
            </div>
          )}
          
          {/* Header Buttons */}
          <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-4 z-10">
            <button
              onClick={onClose}
              className="bg-gray-800 bg-opacity-70 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-90 transition-all"
            >
              {lang === 'ar' ? (
                <ChevronRight className="w-6 h-6 text-white" />
              ) : (
              <ChevronLeft className="w-6 h-6 text-white" />
              )}
            </button>
           
          </div>
        </div>

        {/* Full-screen image viewer */}
        {isImageOpen && item.image_url ? (
          <div
            className="fixed inset-0 z-2000 bg-black/80 p-4"
            onClick={() => setIsImageOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setIsImageOpen(false)}
              className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} h-11 w-11 rounded-full bg-white/15 text-white text-2xl leading-none flex items-center justify-center hover:bg-white/20`}
              aria-label={t(lang, 'close')}
            >
              ✕
            </button>
            <div
              className="mx-auto h-[82vh] w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={item.image_url}
                alt={displayItemName}
                className="h-full w-full object-contain rounded-2xl"
              />
            </div>
          </div>
        ) : null}

        {/* White Card Overlay */}
        <div className="relative mt-[27vh] bg-white rounded-t-4xl min-h-[60vh]">
          <div className="p-6">
            {/* Item Header */}
            <div className="mb-6">
              {/* Badge */}
              <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded mb-3">
                {t(lang, 'chef_choice_badge')}
              </span>
              
              {/* Title and Price */}
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-2xl text-text-primary font-semibold flex-1">{displayItemName}</h2>
                <span className="text-primary font-bold text-2xl ml-4">
                  {item.base_price}Dh
                </span>
              </div>

           
              {/* Description */}
              <div className="mb-4">
                <h3 className="font-bold text-text-primary mb-2">{t(lang, 'description')}</h3>
                <p className="text-text-secondary text-md leading-relaxed">{displayDescription}</p>
              </div>

              {/* Allergens */}
              {item.allergens?.length ? (
                <div className="mb-4">
                  <h3 className="font-bold text-text-primary mb-2">{t(lang, 'allergens')}</h3>
                  <div className="flex gap-2 overflow-x-auto flex-nowrap pr-1">
                    {item.allergens.map((a) => (
                      <span
                        key={a}
                        className="shrink-0 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* In-cart details */}
              {matchingCartItems.length > 0 && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-green-800">
                        {t(lang, 'in_your_cart', { count: totalQtyInCart })}
                      </div>
                      <div className="text-xs text-green-700">
                        {t(lang, 'configurations', { count: matchingCartItems.length })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {matchingCartItems.map((ci) => {
                      const variantName = ci.selectedVariant?.name
                      const mods = (ci.selectedModifiers || []).map((m) => m.modifierName).filter(Boolean)
                      const modsText = mods.length ? mods.join(', ') : null
                      const note = ci.specialInstructions?.trim()
                      const details = [variantName, modsText, note ? t(lang, 'note') : null].filter(Boolean).join(' • ')

                      return (
                        <div
                          key={ci.id}
                          className="flex items-start justify-between gap-3 rounded-lg bg-white/70 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-text-primary">
                              ×{ci.quantity}
                            </div>
                            {details && (
                              <div className="text-xs text-text-secondary truncate">
                                {details}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setEditingCartItem(ci)}
                            className="shrink-0 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 bg-white/80 hover:bg-white px-3 py-2 rounded-lg border border-green-200"
                          >
                            <ReceiptText className="w-3.5 h-3.5" />
                            {t(lang, 'edit')}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

             
            </div>

            {/* VARIANTS SECTION - Cooking Preference */}
            {variants.length > 0 && (
              <div className="mb-6" ref={variantsRef}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">{t(lang, 'cooking_preference')}</h3>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                    {t(lang, 'required')}
                  </span>
                </div>
                {variantError && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    {t(lang, 'choose_variant')}
                  </div>
                )}
                <div className="flex gap-3 overflow-x-auto flex-nowrap pb-1">
                  {variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id
                    const variantPrice = item.base_price + (variant.price_adjustment || 0)
                    const variantName =
                      (lang === 'ar' ? variant.name_ar : lang === 'fr' ? variant.name_fr : variant.name) ||
                      variant.name

                    return (
                      <button
                      key={variant.id}
                        type="button"
                        onClick={() => handleSelectVariant(variant)}
                        className={`shrink-0 min-w-[120px] rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                          isSelected
                          ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`text-sm font-extrabold ${isSelected ? 'text-green-700' : 'text-text-primary'}`}>
                              {variantName}
                            </div>
                            <div className={`text-sm font-semibold ${isSelected ? 'text-green-600' : 'text-gray-700'}`}>
                              {variantPrice.toFixed(0)}dh
                            </div>
                          </div>
                          <span
                            aria-hidden="true"
                            className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                              isSelected ? 'border-green-500' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                            )}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* MODIFIERS SECTION - Add Extras */}
            {loading ? (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">{t(lang, 'add_extras')}</h3>
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
                    <div className="text-sm font-semibold text-gray-600">{t(lang, 'please_wait')}</div>
                    <div className="text-xs text-gray-500">{t(lang, 'loading_options')}</div>
                  </div>
                </div>
              </div>
            ) : modifiers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">{t(lang, 'add_extras')}</h3>
                {(() => {
                  const withMods = modifiers.filter((m) => m.price > 0 && addModifierIds.has(m.id))
                  const withoutMods = modifiers.filter((m) => m.price === 0 && removeModifierIds.has(m.id))
                  const count = withMods.length + withoutMods.length
                  if (!count) return null

                  if (!showSelectedExtras) {
                    return (
                      <button
                        type="button"
                        onClick={() => setShowSelectedExtras(true)}
                        className="mb-3 inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800"
                      >
                        {t(lang, 'show_selected_extras', { count })}
                      </button>
                    )
                  }

                  return (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-text-primary">
                          {t(lang, 'selected_modifiers')}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSelectedExtras(false)}
                          className="text-gray-500 hover:text-gray-800 font-semibold"
                          aria-label={t(lang, 'hide_selected_extras')}
                          title={t(lang, 'hide')}
                        >
                          ✕
                        </button>
                      </div>
                      {withMods.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs font-bold text-gray-600 mb-1">{t(lang, 'with')}</div>
                          <div className="flex gap-2 overflow-x-auto flex-nowrap pr-1">
                            {withMods.map((modifier) => (
                              <span
                                key={modifier.id}
                                className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold border border-gray-200"
                              >
                                <span className="max-w-[220px] truncate">
                                  {(lang === 'ar' ? modifier.name_ar : modifier.name_fr) || modifier.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setModifierChoice(modifier, 'without')}
                                  className="shrink-0 text-gray-500 hover:text-gray-800"
                                  aria-label={t(lang, 'set_without', { item: (lang === 'ar' ? modifier.name_ar : modifier.name_fr) || modifier.name })}
                                  title={t(lang, 'without')}
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {withoutMods.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-gray-600 mb-1">{t(lang, 'without')}</div>
                          <div className="flex gap-2 overflow-x-auto flex-nowrap pr-1">
                            {withoutMods.map((modifier) => (
                              <span
                                key={modifier.id}
                                className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-800 px-3 py-1 text-xs font-semibold border border-red-200"
                              >
                                <span className="max-w-[220px] truncate">
                                  {t(lang, 'no_prefix')} {(lang === 'ar' ? modifier.name_ar : modifier.name_fr) || modifier.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setModifierChoice(modifier, 'with')}
                                  className="shrink-0 text-red-600 hover:text-red-800"
                                  aria-label={t(lang, 'set_with', { item: (lang === 'ar' ? modifier.name_ar : modifier.name_fr) || modifier.name })}
                                  title={t(lang, 'with')}
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
                {/* Modifiers Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {modifiers.map((modifier) => {
                    const choice =
                      modifier.price === 0
                        ? removeModifierIds.has(modifier.id)
                          ? 'without'
                          : 'with'
                        : addModifierIds.has(modifier.id)
                          ? 'with'
                          : 'without'
                    const modifierName =
                      (lang === 'ar' ? modifier.name_ar : lang === 'fr' ? modifier.name_fr : modifier.name) ||
                      modifier.name
                    const secondaryName = lang === 'ar' 
                      ? modifier.name 
                      : lang === 'fr' 
                        ? modifier.name 
                        : modifier.name_fr

                    return (
                      <div
                        key={modifier.id}
                        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                          choice === 'with' && modifier.price > 0
                            ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md shadow-green-100'
                            : choice === 'without' && modifier.price === 0
                              ? 'border-red-300 bg-gradient-to-r from-red-50 to-rose-50 shadow-md shadow-red-100'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            {/* Left: Name & Price */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-800 truncate">
                                  {modifierName}
                                </span>
                                {modifier.price > 0 && (
                                  <span className="shrink-0 inline-flex items-center rounded-lg bg-green-100 text-green-700 px-2.5 py-1 text-xs font-bold">
                                    +{modifier.price.toFixed(0)} DH
                                  </span>
                                )}
                              </div>
                              {secondaryName && secondaryName !== modifierName && (
                                <p className="text-xs text-gray-400 truncate">{secondaryName}</p>
                              )}
                            </div>

                            {/* Right: Toggle Buttons */}
                            <div
                              className="shrink-0 inline-flex items-center rounded-full bg-gray-100 p-1"
                              role="group"
                            >
                              <button
                                type="button"
                                onClick={() => setModifierChoice(modifier, 'with')}
                                aria-pressed={choice === 'with'}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                                  choice === 'with'
                                    ? 'bg-green-500 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                {t(lang, 'with')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setModifierChoice(modifier, 'without')}
                                aria-pressed={choice === 'without'}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                                  choice === 'without'
                                    ? 'bg-red-500 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                {t(lang, 'without')}
                              </button>
                            </div>
                          </div>
                        </div>
                       
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SPECIAL INSTRUCTIONS */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">{t(lang, 'special_instructions')}</h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder={t(lang, 'special_instructions_placeholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Fixed Bottom Bar */}
          <div className="fixed bottom-0 bg-white border-t z-111 border-gray-200  px-4 w-full py-4">
            <div className="flex  gap-3 md:flex-row items-center justify-between ">
              {/* Quantity Selector */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className=" w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  aria-label={t(lang, 'decrease_quantity')}
                >
                  −
                </button>
                <span className="font-bold text-lg w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className=" w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  aria-label={t(lang, 'increase_quantity')}
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {matchingCartItems.length > 0 ? t(lang, 'add_more') : t(lang, 'add_to_cart')} Dh{itemTotal.toFixed(2)}
              </button>
            </div>
          </div>

          {/* Related Items Section */}
          {relatedItems.length > 0 && onSelectItem && (
            <div className="mt-4 pt-4 px-4 border-t border-dashed border-gray-200">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm">✨</span>
                </div>
                <h3 className="font-bold text-gray-800">
                  {t(lang, 'more_from_category')}
                </h3>
              </div>
              
              {/* Items Carousel */}
              <div className="flex gap-3  overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
                {relatedItems.slice(0, 8).map((relatedItem) => (
                  <button
                    key={relatedItem.id}
                    onClick={() => onSelectItem(relatedItem)}
                    className="flex-shrink-0 w-32 snap-start group"
                  >
                    {/* Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group-hover:shadow-lg group-hover:border-orange-200 transition-all duration-300 group-active:scale-95">
                      {/* Image */}
                      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                        {relatedItem.image_url ? (
                          <img
                            src={relatedItem.image_url}
                            alt={pickName(lang, relatedItem)}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl opacity-30">🍽️</span>
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      {/* Content */}
                      <div className="p-2.5">
                        {/* Name */}
                        <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1.5 group-hover:text-orange-600 transition-colors leading-tight min-h-[2rem]">
                          {pickName(lang, relatedItem)}
                        </p>
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-orange-500">
                            {relatedItem.base_price}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400">DH</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}