import fr from '@/i18n/fr'
import ar from '@/i18n/ar'
import en from '@/i18n/en'

export type Lang = 'fr' | 'ar' | 'en'

const DICTS = { fr, ar, en } as const

export type I18nKey = keyof typeof fr

export function t(
  lang: Lang,
  key: I18nKey,
  vars?: Record<string, string | number>
): string {
  const dict = DICTS[lang] ?? DICTS.fr
  let out: string = dict[key] ?? DICTS.fr[key] ?? key 
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v))
    }
  }
  return out
}

type LocalizedName = {
  name: string
  name_fr?: string | null
  name_ar?: string | null
}

export function pickName(lang: Lang, obj: LocalizedName): string {
  if (lang === 'ar') return obj.name_ar?.trim() || obj.name
  if (lang === 'fr') return obj.name_fr?.trim() || obj.name
  return obj.name
}

type LocalizedDescription = {
  description: string
  description_ar?: string | null
  description_fr?: string | null
}

export function pickDescription(lang: Lang, obj: LocalizedDescription): string {
  if (lang === 'ar') return obj.description_ar?.trim() || obj.description
  if (lang === 'fr') return obj.description_fr?.trim() || obj.description
  return obj.description
}

