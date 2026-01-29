'use client'

import { useEffect, useState } from 'react'
import { t, Lang } from '@/lib/i18n'

interface RestaurantErrorProps {
  type: 'not_found' | 'generic'
  message?: string
}

export default function RestaurantError({ type, message }: RestaurantErrorProps) {
  const [lang, setLang] = useState<Lang>('fr')

  useEffect(() => {
    // Try to detect browser language
    const browserLang = navigator.language?.slice(0, 2)
    if (browserLang === 'ar') setLang('ar')
    else if (browserLang === 'en') setLang('en')
    else setLang('fr')
  }, [])

  const isRtl = lang === 'ar'
  const isNotFound = type === 'not_found'

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-md w-full text-center">
        {/* Animated illustration */}
        <div className="relative mb-8">
          <div className="text-8xl animate-bounce">
            {isNotFound ? '🍽️' : '😕'}
          </div>
          <div className="absolute -top-2 -right-4 text-3xl animate-pulse">
            {isNotFound ? '❓' : '⚠️'}
          </div>
          <div className="absolute -bottom-2 -left-4 text-2xl animate-pulse delay-300">
            {isNotFound ? '🔍' : '🔧'}
          </div>
        </div>

        {/* Error message */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-orange-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            {isNotFound 
              ? t(lang, 'error_restaurant_not_found')
              : t(lang, 'error_generic')
            }
          </h1>
          
          <p className="text-gray-500 mb-6">
            {isNotFound 
              ? t(lang, 'error_restaurant_not_found_subtitle')
              : t(lang, 'error_generic_subtitle')
            }
          </p>

          {/* Show technical error in dev mode */}
          {message && process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="text-xs text-red-600 font-mono break-all">
                {message}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
            >
              {t(lang, 'error_try_again')}
            </button>
          </div>

          {/* Language selector */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex justify-center gap-2">
              {(['fr', 'en', 'ar'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    lang === l
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {l === 'fr' ? '🇫🇷 FR' : l === 'en' ? '🇬🇧 EN' : '🇸🇦 AR'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="mt-8 flex justify-center gap-4 text-4xl opacity-30">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🍕</span>
          <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🍔</span>
          <span className="animate-bounce" style={{ animationDelay: '200ms' }}>🍟</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🥗</span>
          <span className="animate-bounce" style={{ animationDelay: '400ms' }}>🍰</span>
        </div>
      </div>
    </div>
  )
}
