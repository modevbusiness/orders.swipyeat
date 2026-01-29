'use client'

/* eslint-disable @next/next/no-img-element */

import MenuItemModal from "@/component/MenuItemModal"
import Cart from "@/component/Cart"
import NotificationPermissionModal, { useNotificationPermission } from "@/component/NotificationPermissionModal"
import { RestaurantData, MenuItem } from "@/types"
import { useState, useEffect } from "react"
import { useCart } from "@/context/CartContext"
import Item from "./Item"
import Category from "./Category"
import { Search } from "lucide-react"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { Instagram } from "lucide-react"
import { pickName, t, type Lang } from "@/lib/i18n"
import LanguageSelector from "@/component/LanguageSelector"


interface Props {
  initialData: RestaurantData
  tableNumber: string
  restaurantSlug: string
}

export default function MenuPageClient({
  initialData,
  tableNumber,
  restaurantSlug
}: Props) {
  const { restaurant, categories } = initialData
  const { items } = useCart()
  // Default to "Tout" (all categories) on first load
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RestaurantData['categories'][0]['menu_items'][0] | null>(null)
  const [lang, setLang] = useState<Lang>('fr')

  // Notification permission
  const { permission, showModal: showNotifModal, requestPermission, closeModal: closeNotifModal, onPermissionGranted } = useNotificationPermission()

  // Show notification prompt after 5 seconds if not yet decided
  useEffect(() => {
    if (permission === 'default') {
      const timer = setTimeout(() => {
        requestPermission()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [permission, requestPermission])

  const fallbackLogoUrl = 'https://dummyimage.com/80x80/ffffff/111827.png&text=R'

  

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId 
  )  

  const categoryItems = selectedCategoryId !== null 
    ? (selectedCategory?.menu_items || [])
    : categories.flatMap((cat) => cat.menu_items)
  

  const matchesSearch = (item: RestaurantData['categories'][0]['menu_items'][0]) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      (item.name_ar && item.name_ar.toLowerCase().includes(query)) ||
      item.description.toLowerCase().includes(query) ||
      (item.description_ar && item.description_ar.toLowerCase().includes(query))
    )
  }

  const currentItems = categoryItems.filter(matchesSearch)

  const groupedCategories =
    selectedCategoryId === null
      ? categories
          .map((cat) => ({
            category: cat,
            items: (cat.menu_items || []).filter(matchesSearch),
          }))
          .filter((g) => g.items.length > 0)
      : []

   

  const handleOpenModal = (item: MenuItem) => {
    setIsModalOpen(true)
    setSelectedItem(item)
  }

  const anyModalOpen = isModalOpen || isOverlayOpen


  if (isCartOpen) {
    return (
      <Cart
        onClose={() => setIsCartOpen(false)}
        tableNumber={tableNumber}
        restaurantSlug={restaurantSlug}
        restaurantId={restaurant.id}
        lang={lang}
      />
    )
  }

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`${anyModalOpen ? 'h-screen overflow-hidden' : 'min-h-screen'} relative bg-gray-50 shadow-lg`}
    >
      {/* Header with restaurant info */}
      <div className="bg-white shadow   z-1111">
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                  <img
                    src={restaurant.logo_url || fallbackLogoUrl}
                    alt={t(lang, 'restaurant_logo_alt')}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">
                    {restaurant.name}
                  </h1>
                 
                </div>
              </div>
              
            </div>
            {/* Language selector (header) */}
            <LanguageSelector
              value={lang}
              onChange={setLang}
              lang={lang}
            />
          </div>
          <div className="mt-3 flex  items-center gap-2 overflow-x-auto pr-1">
                    {restaurant.google_map_url ? (
                      <a
                        href={restaurant.google_map_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-1 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-3 text-xs font-bold text-primary hover:bg-primary/10"
                      >
                        <img
                          src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
                          alt="Google"
                          className="h-4 w-4"
                        />
                       <div className="flex flex-col">
                       <span className="whitespace-nowrap">{t(lang, 'google_review')}</span>
                       <span className="text-amber-500 leading-none">★★★★★</span>
                       </div>
                      </a>
                    ) : null}
                    {restaurant.instagram_url ? (
                      <a
                        href={restaurant.instagram_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Instagram"
                        className="inline-flex flex-1 items-center gap-2 rounded-full border border-fuchsia-300/60 bg-linear-to-r from-fuchsia-600 to-rose-500 px-3 h-[50px] text-xs font-extrabold text-white shadow-md shadow-fuchsia-500/20 hover:shadow-lg hover:shadow-fuchsia-500/30 transition-shadow"
                      >
                        <Instagram className="h-4 w-4 text-white" />
                        <span className="whitespace-nowrap">{t(lang, 'instagram')}</span>
                      </a>
                    ) : null}
                  </div>
        </div>
      </div>

      <div className="max-w-7xl min-h-screen pb-[100px] relative mx-auto  bg-white z-10 py-2">
        {/* Search Filter */}

        {categories.length > 0 && (
        <div className="sticky top-0 w-full  py-2 bg-white z-1111">
        <div className="mb-2 px-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(lang, 'search_placeholder')}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-1 bg-gray-100 focus:ring-primary/80 outline-none  text-lg"
            />
            <span className="absolute left-3 top-1/2  transform -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4 text-primary" />
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
          <div className=" z-10 px-4">
            <div className="flex gap-2 px-2 overflow-x-auto py-2 ">
            <button    
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-3 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                    selectedCategoryId === null
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {t(lang, 'all_categories')}
                </button>
              {categories.map((category) => (
                <Category
                  key={category.id}
                  category={category}
                  selectedCategoryId={selectedCategoryId}
                  setSelectedCategoryId={setSelectedCategoryId}
                  lang={lang}
                />
              ))}
             
            </div>
          </div>
        </div>
        )}

        {/* Menu Items */}
        {selectedCategoryId === null ? (
          groupedCategories.length > 0 ? (
            <div className="px-4 space-y-4">
              {groupedCategories.map(({ category, items }) => (
                <section key={category.id}>
                  <div className="sticky top-28 z-10 -mx-4 px-4 pb-1 bg-white/95 backdrop-blur border-b border-gray-100">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-extrabold text-text-primary">
                        {pickName(lang, category)}
                      </h2>
                      <span className="text-xs font-semibold text-gray-500">
                        {items.length}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((item) => (
                      <div key={item.id}>
                        <Item
                          item={item}
                          handleOpenModal={handleOpenModal}
                          onOverlayChange={setIsOverlayOpen}
                          lang={lang}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="relative mb-6">
                <div className="text-7xl animate-bounce">🍽️</div>
                <div className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                {searchQuery
                  ? t(lang, 'no_items_found', { query: searchQuery })
                  : t(lang, 'no_items_restaurant')}
              </h3>
              {!searchQuery && (
                <p className="text-gray-500 text-center max-w-xs">
                  {t(lang, 'no_items_restaurant_subtitle')}
                </p>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
                >
                  {t(lang, 'clear_search')}
                </button>
              )}
            </div>
          )
        ) : currentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-4 gap-3">
            {currentItems.map((item) => (
              <div key={item.id}>
                <Item
                  item={item}
                  handleOpenModal={handleOpenModal}
                  onOverlayChange={setIsOverlayOpen}
                  lang={lang}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="relative mb-6">
              <div className="text-6xl">{searchQuery ? '🔍' : '🍴'}</div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
              {searchQuery
                ? t(lang, 'no_items_found', { query: searchQuery })
                : t(lang, 'no_items_category')}
            </h3>
            {!searchQuery && (
              <p className="text-gray-500 text-center max-w-xs">
                {t(lang, 'no_items_category_subtitle')}
              </p>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                {t(lang, 'clear_search')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {!anyModalOpen && categories.length > 0 && (
     <div className="fixed bottom-5 flex justify-center mx-auto z-40  w-full">
         <button
          onClick={() => setIsCartOpen(true)}
          aria-label={t(lang, 'open_cart')}
          className="w-[calc(100%-2rem)] relative rounded-full h-14  bg-primary shadow-lg shadow-primary/40 hover:shadow-xl transition-shadow flex items-center justify-center"
        >
          {items?.length > 0 && (
            <span
              className="absolute -top-4 right-0 h-8 w-8 rounded-full bg-white text-primary text-base font-bold flex items-center justify-center shadow border-2 border-primary"
            >
              {items.length}
            </span>
          )}
          <span className="absolute top-1/2 -translate-y-1/2 right-4 text-white">
            <ArrowRight className="h-5 w-5" />
          </span>
          <div className="inline-flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-sm">
              {t(lang, 'view_cart')}
            </span>
          </div>
        </button>
     </div>
      )}

      {isModalOpen && selectedItem && (
        <MenuItemModal
          item={selectedItem}
          lang={lang}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          relatedItems={
            categories
              .find((cat) => cat.id === selectedItem.category_id)
              ?.menu_items.filter((i) => i.id !== selectedItem.id && i.is_available) || []
          }
          onSelectItem={(newItem) => setSelectedItem(newItem)}
        />
      )}

      {/* Notification Permission Modal */}
      {showNotifModal && (
        <NotificationPermissionModal
          lang={lang}
          onClose={closeNotifModal}
          onAllow={onPermissionGranted}
        />
      )}

    </div>
  )
}