'use client'

import { useState } from 'react'
import { Modifier, MenuItem } from '@/types'
import { useMenuItemDetails } from '@/hooks/useMenuItemDetails'
import { useCart } from '@/context/CartContext'
import type { Lang } from '@/lib/i18n'
import { pickName } from '@/lib/i18n'
import { t } from '@/lib/i18n'

interface QuickAddModalProps {
  item: MenuItem
  isOpen: boolean
  onClose: () => void
  lang?: Lang
}

export default function QuickAddModal({
  item,
  isOpen,
  onClose,
  lang = 'fr',
}: QuickAddModalProps) {
  const { addItem } = useCart()
  const { modifiers, menuItemModifiers, loading } = useMenuItemDetails(item.id)
  const displayItemName = pickName(lang, item)

  const [addModifierIds, setAddModifierIds] = useState<Set<string>>(() => new Set())
  const [removeModifierIds, setRemoveModifierIds] = useState<Set<string>>(() => new Set())

  if (!isOpen) return null

  // Calculate total price
  const modifiersPrice = Array.from(addModifierIds).reduce((sum, id) => {
    const price = modifiers.find((m) => m.id === id)?.price ?? 0
    return sum + price
  }, 0)
  const itemTotal = item.base_price + modifiersPrice

  const setModifierChoice = (modifier: Modifier, choice: 'with' | 'without') => {
    const id = modifier.id
    // price == 0: treat as ingredient toggle (With = default, Without = send to kitchen remove list)
    if (modifier.price === 0) {
      if (choice === 'without') setRemoveModifierIds((prev) => new Set(prev).add(id))
      else
        setRemoveModifierIds((prev) => {
          if (!prev.has(id)) return prev
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      // never include free items in paid extras list
      setAddModifierIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      return
    }

    // price > 0: treat as paid extra (With = add, Without = not added)
    if (choice === 'with') setAddModifierIds((prev) => new Set(prev).add(id))
    else
      setAddModifierIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    // never put paid extras in remove list
    setRemoveModifierIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleAddToCart = () => {
    addItem({
      menuItemId: item.id,
      menuItemName: item.name,
      menuItemName_ar: item.name_ar,
      menuItemName_fr: item.name_fr,
      imageUrl: item.image_url,
      quantity: 1,
      base_price: item.base_price,
      selectedVariant: undefined,
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
      specialInstructions: undefined,
    })
    onClose()
    // Reset selections
    setAddModifierIds(new Set())
    setRemoveModifierIds(new Set())
  }

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{displayItemName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Modifiers Section */}
          {loading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-9 w-9 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
                  <div className="text-sm font-semibold text-gray-600">{t(lang, 'please_wait')}</div>
                  <div className="text-xs text-gray-500">{t(lang, 'loading_options')}</div>
                </div>
              </div>
            </div>
          ) : modifiers.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">{t(lang, 'add_extras')}</h3>
              {modifiers.some((m) => (m.price ?? 0) > 0) && (
                <div className="mb-3 text-xs font-bold text-gray-600">
                  {t(lang, 'paid_extras')}
                </div>
              )}
              <div className="space-y-3">
                {modifiers.map((modifier) => {
                  const isRequired =
                    menuItemModifiers.find(
                      (m) => m.modifier_id === modifier.id
                    )?.is_required || false

                  const choice =
                    modifier.price === 0
                      ? removeModifierIds.has(modifier.id)
                        ? 'without'
                        : 'with'
                      : addModifierIds.has(modifier.id)
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
                              {`+$${modifier.price.toFixed(2)}`}
                            </span>
                          )}
                        </div>
                        {(lang === 'ar' ? modifier.name_ar : modifier.name_fr) && (
                          <div className="text-xs text-gray-500 mt-1 text-right">
                            {(lang === 'ar' ? modifier.name_ar : modifier.name_fr) as string}
                          </div>
                        )}
                       
                        {isRequired && (
                          <div className="mt-2 text-xs font-semibold text-red-600">
                            {t(lang, 'required')}
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
          ) : (
            <div className="mb-6">
              <p className="text-gray-500 text-center py-4">
                {t(lang, 'no_modifiers')}
              </p>
            </div>
          )}

          {/* Price Summary */}
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">{t(lang, 'base_price')}:</span>
              <span>${item.base_price.toFixed(2)}</span>
            </div>
            {modifiersPrice > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">{t(lang, 'extras')}:</span>
                <span>+${modifiersPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t pt-2 mt-2">
              <span className="font-bold text-lg">{t(lang, 'total')}:</span>
              <span className="text-2xl font-bold text-green-600">
                ${itemTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary hover:bg-primary/70 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
          >
            {t(lang, 'add_to_cart')}
          </button>
        </div>
      </div>
    </div>
  )
}
