import TrackOrder from '@/component/TrackOrder'
import { supabase } from '@/lib/supabase'
import type { Lang } from '@/lib/i18n'

interface PageParams {
  params: Promise<{
    slug: string
    tableNumber: string
  }>
  searchParams: Promise<{
    lang?: string
    orderNumber?: string
  }>
}

export default async function TrackOrderPage({ params, searchParams }: PageParams) {
  const { slug, tableNumber } = await params
  const { lang } = await searchParams

  // Fetch restaurant data to get Google Maps URL
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('google_map_url')
    .eq('slug', slug)
    .single()

  // Validate and default language
  const validLang: Lang = (lang === 'en' || lang === 'fr' || lang === 'ar') ? lang : 'fr'

  return (
    <TrackOrder
      tableNumber={tableNumber}
      restaurantSlug={slug}
      googleMapsUrl={restaurant?.google_map_url}
      lang={validLang}
    />
  )
}
