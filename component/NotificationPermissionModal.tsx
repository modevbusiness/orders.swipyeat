'use client'

import { useState, useEffect } from 'react'
import { t, Lang } from '@/lib/i18n'

interface NotificationPermissionModalProps {
  lang: Lang
  onClose: () => void
  onAllow: () => void
}

export default function NotificationPermissionModal({
  lang,
  onClose,
  onAllow,
}: NotificationPermissionModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const isRtl = lang === 'ar'

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleAllow = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        onAllow()
      }
      onClose()
    } catch {
      onClose()
    }
  }

  const handleLater = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-500 ${
        isVisible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleLater}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-12 scale-90'
        }`}
      >
        {/* Card */}
        <div className="bg-gradient-to-b from-white to-orange-50/50 rounded-[2rem] shadow-2xl shadow-orange-900/10 overflow-hidden border border-orange-100/50">
          
          {/* Top illustration area */}
          <div className="relative bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 pt-8 pb-12 px-6">
            {/* Floating food emojis */}
            <div className="absolute top-4 left-6 text-2xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>🍕</div>
            <div className="absolute top-8 right-8 text-xl animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.2s' }}>🍔</div>
            <div className="absolute bottom-4 left-10 text-lg animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '1.8s' }}>🍟</div>
            <div className="absolute bottom-6 right-12 text-xl animate-bounce" style={{ animationDelay: '0.9s', animationDuration: '2.4s' }}>🥤</div>
            
            {/* Main icon */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-orange-300 rounded-full blur-xl opacity-40 scale-110" />
                
                {/* Icon circle */}
                <div className="relative w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center">
                  {/* Bell with animation */}
                  <div className="relative animate-[wiggle_1s_ease-in-out_infinite]">
                    <span className="text-5xl">🔔</span>
                    {/* Notification dot */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 -mt-4">
            {/* White content card */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100/50 p-5">
              {/* Title */}
              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                {t(lang, 'notif_title')} ✨
              </h2>

              {/* Message */}
              <p className="text-gray-500 text-center text-sm leading-relaxed mb-5">
                {t(lang, 'notif_message')}
              </p>

              {/* Buttons */}
              <div className="space-y-2.5">
                {/* Primary button */}
                <button
                  onClick={handleAllow}
                  className="group w-full py-3.5 px-5 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white font-semibold rounded-xl shadow-md shadow-orange-200/50 hover:shadow-lg hover:shadow-orange-300/50 transition-all duration-200 active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg transition-transform group-hover:scale-110">🔔</span>
                    {t(lang, 'notif_allow')}
                  </span>
                </button>

                {/* Secondary button */}
                <button
                  onClick={handleLater}
                  className="w-full py-3 px-5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 font-medium rounded-xl transition-all duration-200"
                >
                  {t(lang, 'notif_later')}
                </button>
              </div>
            </div>

            {/* Helper text */}
            <p className="mt-4 text-[11px] text-gray-300 text-center px-2">
              {t(lang, 'notif_helper')}
            </p>
          </div>
        </div>
      </div>

      {/* Custom animation keyframes */}
      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  )
}

// Hook to manage notification permission state
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)
  }, [])

  const requestPermission = () => {
    if (permission === 'default') {
      setShowModal(true)
    }
  }

  const closeModal = () => setShowModal(false)

  const onPermissionGranted = () => {
    setPermission('granted')
  }

  return {
    permission,
    showModal,
    requestPermission,
    closeModal,
    onPermissionGranted,
  }
}
