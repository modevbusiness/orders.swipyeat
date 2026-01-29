
// Data structure you'll receive:
export type RestaurantData = {
  restaurant: {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    google_map_url?: string | null
    instagram_url?: string | null
  }
  categories: Array<{
    id: string
    name: string
    name_ar: string | null
    name_fr: string | null
    description: string | null
    image_url: string | null
    menu_items: Array<{
      id: string
      name: string
      name_ar: string | null
      name_fr: string | null
      description: string
      description_ar?: string | null
      base_price: number
      image_url: string | null
      category_id: string
      preparation_time: number
      is_available: boolean
      allergens: string[] | null
      restaurant_id: string
      // Optional nested relations (included by some Supabase selects)
      menu_item_modifiers?: Array<{
        menu_item_id?: string
        modifier_id?: string
        max_selections?: number
        is_required?: boolean
        modifiers?: Modifier | Modifier[]
      }>
      item_variants?: Array<{
        id?: string
        is_available?: boolean
      }>
    }>
  }>
}

export type Modifier = {
  id: string
  restaurant_id?: string
  name: string
  name_ar: string | null
  name_fr: string | null
  modifier_type: 'choice' | 'multiple' | 'checkbox'
  price: number
  is_default?: boolean
  is_active: boolean
}

export type ItemVariant = {
  id: string
  menu_item_id: string
  name: string
  name_ar: string | null
  name_fr: string | null
  price_adjustment: number
  is_available: boolean
}

export type MenuItemModifier = {
  menu_item_id: string
  modifier_id: string
  is_required: boolean
  max_selections: number
}

export type MenuItem = RestaurantData['categories'][0]['menu_items'][0]

export type CartItem = {
  id: string // Unique ID for cart item
  restaurantId?: string
  menuItemId: string
  menuItemName: string
  menuItemName_ar?: string | null
  menuItemName_fr?: string | null
  imageUrl?: string | null
  quantity: number
  base_price: number
  selectedVariant?: {
    id: string
    name: string
    name_ar?: string | null
    name_fr?: string | null
    priceAdjustment: number
  }
  selectedModifiers: Array<{
    modifierId: string
    modifierName: string
    modifierName_ar?: string | null
    modifierName_fr?: string | null
    price: number
  }>
  // Modifiers/ingredients the client wants REMOVED (kitchen should not add them)
  removedModifiers?: Array<{
    modifierId: string
    modifierName: string
    modifierName_ar?: string | null
    modifierName_fr?: string | null
  }>
  specialInstructions?: string
  totalPrice: number
}
