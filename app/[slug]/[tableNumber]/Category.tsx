'use client'

import { RestaurantData } from '@/types'
import Image from 'next/image'
import { pickName, type Lang } from '@/lib/i18n'

type CategoryType = RestaurantData['categories'][0]

const Category = ({
  category,
  selectedCategoryId,
  setSelectedCategoryId,
  lang,
}: {
  category: CategoryType
  selectedCategoryId: string | null
  setSelectedCategoryId: (id: string) => void
  lang: Lang
}) => {
    const displayName = pickName(lang, category)
    return (
    <button
        key={category.id}
        onClick={() => setSelectedCategoryId(category.id)}
        className={`shrink-0 w-28 flex flex-col items-stretch gap-2 rounded-2xl p-1 transition-all ${
          selectedCategoryId === category.id
            ? 'bg-primary/10 ring-2 ring-primary'
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        <div className="relative h-16 w-full overflow-hidden rounded-2xl bg-white shadow-sm">
          {category.image_url ? (
            <img
              src={category.image_url || ''}
              alt={displayName}
              className="object-cover h-full w-full"
              width={112}
              height={112}
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-gray-200 to-gray-300" />
          )}
        </div>
        <div className="w-full">
          <div className="text-xs font-semibold text-text-primary truncate text-center">
            {displayName}
          </div>
        
        </div>
      </button>
    )
}

export default Category
