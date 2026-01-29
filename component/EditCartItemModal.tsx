'use client'

/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from 'react'
import { Modifier, ItemVariant, MenuItem, CartItem } from '@/types'
import { useMenuItemDetails } from '@/hooks/useMenuItemDetails'
import { useCart } from '@/context/CartContext'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import type { Lang } from '@/lib/i18n'
import { pickDescription, pickName, t } from '@/lib/i18n'

interface EditCartItemModalProps {
  cartItem: CartItem
  menuItem: MenuItem
  lang?: Lang
  isOpen: boolean
  onClose: () => void
}

export default function EditCartItemModal({
  cartItem,
  menuItem,
  lang = 'fr',
  isOpen,
  onClose,
}: EditCartItemModalProps) {
  const displayItemName = pickName(lang, menuItem)
  const displayDescription = pickDescription(lang, {
    description: menuItem.description,
    description_ar: menuItem.description_ar,
  })
  const { updateItem } = useCart()
  const { variants, modifiers, loading } = useMenuItemDetails(menuItem.id)

  const [quantity, setQuantity] = useState(cartItem.quantity)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    cartItem.selectedVariant?.id ?? null
  )
  const [selectedModifierIds, setSelectedModifierIds] = useState<Set<string>>(
    () => new Set((cartItem.selectedModifiers || []).map((m) => m.modifierId))
  )
  const [removedModifierIds, setRemovedModifierIds] = useState<Set<string>>(
    () => new Set((cartItem.removedModifiers || []).map((m) => m.modifierId))
  )
  const [showSelectedExtras, setShowSelectedExtras] = useState(true)
  const [variantError, setVariantError] = useState(false)
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [specialInstructions, setSpecialInstructions] = useState(
    cartItem.specialInstructions || ''
  )
  const variantsRef = useRef<HTMLDivElement | null>(null)

  const selectedVariant = useMemo<ItemVariant | null>(() => {
    if (!selectedVariantId) return null
    return variants.find((v) => v.id === selectedVariantId) ?? null
  }, [variants, selectedVariantId])

  if (!isOpen) return null

  // Calculate total price
  const variantPrice =
    selectedVariant?.price_adjustment ?? cartItem.selectedVariant?.priceAdjustment ?? 0
  const modifiersPrice = Array.from(selectedModifierIds).reduce((sum, id) => {
    const fromDb = modifiers.find((m) => m.id === id)?.price
    const fromCart = cartItem.selectedModifiers?.find((m) => m.modifierId === id)?.price
    return sum + (fromDb ?? fromCart ?? 0)
  }, 0)
  const itemTotal = (menuItem.base_price + variantPrice + modifiersPrice) * quantity

  // (removed legacy checkbox handlers)

  const setModifierChoice = (modifier: Modifier, choice: 'with' | 'without') => {
    const id = modifier.id
    setShowSelectedExtras(true)

    if (modifier.price === 0) {
      // free ingredient toggle (With default; Without => remove)
      if (choice === 'without') setRemovedModifierIds((prev) => new Set(prev).add(id))
      else
        setRemovedModifierIds((prev) => {
          if (!prev.has(id)) return prev
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      // ensure it's not in paid extras
      setSelectedModifierIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      return
    }

    // paid extra toggle (With => add; Without => not added)
    if (choice === 'with') setSelectedModifierIds((prev) => new Set(prev).add(id))
    else
      setSelectedModifierIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    // never put paid extras in remove list
    setRemovedModifierIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleSaveChanges = () => {
    if (variants.length > 0 && !selectedVariantId) {
      setVariantError(true)
      variantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setVariantError(false)

    const selectedModsFromDb = modifiers
      .filter((m) => m.price > 0 && selectedModifierIds.has(m.id))
      .map((m) => ({
        modifierId: m.id,
        modifierName: pickName(lang, { name: m.name, name_ar: m.name_ar, name_fr: m.name_fr }),
        price: m.price,
      }))
    const selectedModsFromCart = (cartItem.selectedModifiers || []).filter(
      (m) => selectedModifierIds.has(m.modifierId) && !selectedModsFromDb.some((x) => x.modifierId === m.modifierId)
    )

    const removedModsFromDb = modifiers
      .filter((m) => m.price === 0 && removedModifierIds.has(m.id))
      .map((m) => ({
        modifierId: m.id,
        modifierName: pickName(lang, { name: m.name, name_ar: m.name_ar, name_fr: m.name_fr }),
      }))
    const removedModsFromCart = (cartItem.removedModifiers || []).filter(
      (m) =>
        removedModifierIds.has(m.modifierId) &&
        !removedModsFromDb.some((x) => x.modifierId === m.modifierId)
    )

    updateItem(cartItem.id, {
      quantity,
      selectedVariant: selectedVariant
        ? {
            id: selectedVariant.id,
            name: pickName(lang, {
            name: selectedVariant.name,
              name_ar: selectedVariant.name_ar,
              name_fr: selectedVariant.name_fr,
            }),
            priceAdjustment: selectedVariant.price_adjustment,
          }
        : undefined,
      selectedModifiers: [...selectedModsFromDb, ...selectedModsFromCart],
      removedModifiers: [...removedModsFromDb, ...removedModsFromCart],
      specialInstructions: specialInstructions || undefined,
      totalPrice: itemTotal,
    })
    onClose()
  }

  const handleSelectVariant = (variant: ItemVariant) => {
    setSelectedVariantId((prev) => (prev === variant.id ? null : variant.id))
    setVariantError(false)
  }

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 bg-white bg-opacity-50 z-1111 min-h-screen pb-[100px] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Item Image - Full Screen Top */}
        <div className="fixed top-0 h-[50vh] w-full">
          {menuItem.image_url ? (
            <img
              src={menuItem.image_url}
              alt={menuItem.name}
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

          {typeof menuItem.preparation_time === 'number' && menuItem.preparation_time > 0 && (
            <div
              className={`absolute top-5 ${lang === 'ar' ? 'left-5' : 'right-5'} z-10 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-gray-900 shadow-sm backdrop-blur`}
            >
              <span>{menuItem.preparation_time}{t(lang, 'min_short')}</span>
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
        {isImageOpen && menuItem.image_url ? (
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
                src={menuItem.image_url}
                alt={displayItemName}
                className="h-full w-full object-contain rounded-2xl"
              />
            </div>
          </div>
        ) : null}

        {/* White Card Overlay */}
        <div className="relative mt-[40vh] bg-white rounded-t-3xl min-h-[60vh]">
          <div className="p-6">
            {/* Item Header */}
            <div className="mb-6">
              {/* Badge */}
              <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded mb-3">
                {t(lang, 'edit_item_badge')}
              </span>

              {/* Title and Price */}
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-2xl font-bold flex-1">{displayItemName}</h2>
                <span className="text-primary font-bold text-2xl ml-4">
                  {itemTotal.toFixed(2)}Dh
                </span>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h3 className="font-bold text-text-primary mb-2">{t(lang, 'description')}</h3>
                <p className="text-text-secondary text-md leading-relaxed">
                  {displayDescription}
                </p>
              </div>

              {/* Allergens */}
              {menuItem.allergens?.length ? (
                <div className="mb-4">
                  <h3 className="font-bold text-text-primary mb-2">{t(lang, 'allergens')}</h3>
                  <div className="flex gap-2 overflow-x-auto flex-nowrap pr-1">
                    {menuItem.allergens.map((a) => (
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
                    const variantPrice = menuItem.base_price + (variant.price_adjustment || 0)
                    const variantName = pickName(lang, {
                      name: variant.name,
                      name_ar: variant.name_ar,
                      name_fr: variant.name_fr,
                    })

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
                  const withMods = modifiers.filter((m) => m.price > 0 && selectedModifierIds.has(m.id))
                  const withoutMods = modifiers.filter((m) => m.price === 0 && removedModifierIds.has(m.id))
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
                      <div className="flex gap-2 overflow-x-auto flex-nowrap pr-1">
                        {withMods.map((modifier) => (
                          <span
                            key={modifier.id}
                            className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold border border-gray-200"
                          >
                            <span className="max-w-[220px] truncate">
                              {pickName(lang, {
                                name: modifier.name,
                                name_ar: modifier.name_ar,
                                name_fr: modifier.name_fr,
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={() => setModifierChoice(modifier, 'without')}
                              className="shrink-0 text-gray-500 hover:text-gray-800"
                              aria-label={t(lang, 'set_without', { item: pickName(lang, { name: modifier.name, name_ar: modifier.name_ar, name_fr: modifier.name_fr }) })}
                              title={t(lang, 'without')}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        {withoutMods.map((modifier) => (
                          <span
                            key={modifier.id}
                            className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-800 px-3 py-1 text-xs font-semibold border border-red-200"
                          >
                            <span className="max-w-[220px] truncate">
                              {t(lang, 'no_prefix')}{' '}
                              {pickName(lang, {
                                name: modifier.name,
                                name_ar: modifier.name_ar,
                                name_fr: modifier.name_fr,
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={() => setModifierChoice(modifier, 'with')}
                              className="shrink-0 text-red-600 hover:text-red-800"
                              aria-label={t(lang, 'set_with', { item: pickName(lang, { name: modifier.name, name_ar: modifier.name_ar, name_fr: modifier.name_fr }) })}
                              title={t(lang, 'with')}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                {modifiers.some((m) => (m.price ?? 0) > 0) && (
                  <div className="mb-2 text-xs font-bold text-gray-600">
                    {t(lang, 'paid_extras')}
                  </div>
                )}
                <div className="space-y-3">
                  {modifiers.map((modifier) => {
                    const choice =
                      modifier.price === 0
                        ? removedModifierIds.has(modifier.id)
                          ? 'without'
                          : 'with'
                        : selectedModifierIds.has(modifier.id)
                          ? 'with'
                          : 'without'
                    const modifierName = pickName(lang, {
                      name: modifier.name,
                      name_ar: modifier.name_ar,
                      name_fr: modifier.name_fr,
                    })

                    return (
                      <div
                        key={modifier.id}
                        className={`group flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                          choice === 'without'
                            ? 'border-red-300 bg-red-50/60 shadow-sm'
                            : choice === 'with'
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-semibold text-text-primary leading-snug">
                              {modifierName}
                            </div>
                            
                            {modifier.price > 0 && (
                              <span className="shrink-0 rounded-full bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 text-xs font-bold">
                                {`+${modifier.price.toFixed(2)}Dh`}
                              </span>
                            )}
                          </div>
                          {(lang === 'ar' ? modifier.name_ar : modifier.name_fr) && (
                            <div className="text-xs text-gray-500 mt-1 text-right">
                              {(lang === 'ar' ? modifier.name_ar : modifier.name_fr) as string}
                            </div>
                          )}
                          
                        </div>
                        <div
                          className="shrink-0 inline-flex items-center rounded-full bg-gray-100 p-1 border border-gray-200"
                          role="group"
                          aria-label={`${modifierName} ${t(lang, 'with')}/${t(lang, 'without')}`}
                        >
                          <button
                            type="button"
                            onClick={() => setModifierChoice(modifier, 'with')}
                            aria-pressed={choice === 'with'}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              choice === 'with'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {t(lang, 'with')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setModifierChoice(modifier, 'without')}
                            aria-pressed={choice === 'without'}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              choice === 'without'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {t(lang, 'without')}
                          </button>
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

          {/* Fixed Bottom Bar (match MenuItemModal) */}
          <div className="fixed bottom-0 bg-white border-t border-gray-200 px-4 w-full py-4">
            <div className="flex gap-3 md:flex-row items-center justify-between">
              {/* Quantity Selector */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  aria-label={t(lang, 'decrease_quantity')}
                >
                  −
                </button>
                <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  aria-label={t(lang, 'increase_quantity')}
                >
                  +
                </button>
              </div>

              {/* Save Changes Button */}
              <button
                onClick={handleSaveChanges}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {t(lang, 'save_changes')} {itemTotal}Dh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
