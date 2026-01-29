import { supabase } from "@/lib/supabase"
import MenuPageClient from "./MenuPageClient"
import { RestaurantData } from "@/types"
import RestaurantError from "@/component/RestaurantError"

interface PageParams {
  params: Promise<{
    slug: string
    tableNumber: string
  }>
}



export default async function Page({ params }: PageParams) {
  const { slug, tableNumber } = await params

  

  
  try {
    // Get restaurant by slug
    const restaurantRes = await supabase
      .from('restaurants')
      .select('id, name, slug, logo_url, google_map_url, instagram_url')
      .eq('slug', slug)
      .single()

    if (restaurantRes.error) throw restaurantRes.error
    if (!restaurantRes.data) throw new Error('Restaurant not found')

    const categoriesRes = await supabase
      .from('categories')
      .select(`
          id,
          name,
          name_ar,
          name_fr,
          description,
          image_url,
          menu_items!inner(
            id,
            name,
            name_ar,
            name_fr,
            description,
            description_ar,
            base_price,
            image_url,
            category_id,
            preparation_time,
            is_available,
            restaurant_id,
            allergens,
            item_variants(
              id,
              is_available
            ),
            menu_item_modifiers(
              menu_item_id,
              modifier_id,
              max_selections,
              is_required,
              modifiers!inner(
                id,
                name,
                name_ar,
                name_fr,
                price,
                is_active,
                modifier_type
              )
            )
          )
        `)
      .eq('restaurant_id', restaurantRes.data.id)
      .eq('is_active', true)
      .eq('menu_items.is_active', true)
      .eq('menu_items.is_available', true)
      .eq('menu_items.menu_item_modifiers.modifiers.is_active', true)
      .order('name')
      .order('name', { referencedTable: 'menu_items' })

    if (categoriesRes.error) throw categoriesRes.error


    const restaurantData = {
      restaurant: restaurantRes.data,
      categories: categoriesRes.data || []
    } as RestaurantData


    return (
      <MenuPageClient
        initialData={restaurantData}
        tableNumber={tableNumber}
        restaurantSlug={restaurantRes.data.slug}
      />
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    const isNotFound = errorMessage.includes('not found') || errorMessage.includes('No rows')
    
    return (
      <RestaurantError 
        type={isNotFound ? 'not_found' : 'generic'} 
        message={errorMessage} 
      />
    )
  }
}
