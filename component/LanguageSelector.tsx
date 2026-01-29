'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Globe, Check } from 'lucide-react'
import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'

interface LanguageSelectorProps {
  value: Lang
  onChange: (lang: Lang) => void
  lang: Lang
}

const languages: Array<{ code: Lang; name: string; nativeName: string; flag: string }> = [
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇲🇦' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
]

export default function LanguageSelector({ value, onChange, lang }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isRtl = lang === 'ar'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLanguage = languages.find((l) => l.code === value) || languages[0]

  const handleSelect = (langCode: Lang) => {
    onChange(langCode)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 rounded-xl border-2 border-primary/30 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm hover:border-primary/50 hover:bg-orange-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label={t(lang, 'lang_label')}
        aria-expanded={isOpen}
      >
        <span className="text-lg">{selectedLanguage.flag}</span>
        <span className="hidden sm:inline">{selectedLanguage.nativeName}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className={`absolute top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${isRtl ? 'left-0' : 'right-0'}`}
          style={{ zIndex: 99999 }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Globe className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-gray-700">{t(lang, 'choose_language')}</span>
            </div>
          </div>

          {/* Language options */}
          <div className="py-2">
            {languages.map((language) => {
              const isSelected = language.code === value
              return (
                <button
                  key={language.code}
                  onClick={() => handleSelect(language.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    isSelected
                      ? 'bg-orange-50 text-orange-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  dir={language.code === 'ar' ? 'rtl' : 'ltr'}
                >
                  {/* Flag */}
                  <span className="text-2xl">{language.flag}</span>
                  
                  {/* Language info */}
                  <div className={`flex-1 ${language.code === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className={`font-semibold ${isSelected ? 'text-orange-600' : 'text-gray-800'}`}>
                      {language.nativeName}
                    </p>
                    <p className="text-xs text-gray-400">{language.name}</p>
                  </div>

                  {/* Check mark */}
                  {isSelected && (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
