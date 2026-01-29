'use client'

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 left-4 right-4  flex flex-col items-center gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setIsVisible(true), 10)
    
    // Start leaving animation
    const leaveTimer = setTimeout(() => {
      setIsLeaving(true)
    }, (toast.duration || 4000) - 300)

    // Remove from DOM
    const removeTimer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 4000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(leaveTimer)
      clearTimeout(removeTimer)
    }
  }, [toast, onRemove])

  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  }

  const colors: Record<ToastType, string> = {
    success: 'from-emerald-500 to-green-500',
    error: 'from-red-500 to-rose-500',
    info: 'from-blue-500 to-indigo-500',
    warning: 'from-amber-500 to-orange-500',
  }

  const bgColors: Record<ToastType, string> = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-amber-50 border-amber-200',
  }

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm transform transition-all duration-300 ease-out ${
        isVisible && !isLeaving
          ? 'translate-y-0 opacity-100 scale-100'
          : '-translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div className={`relative overflow-hidden rounded-2xl border shadow-lg ${bgColors[toast.type]}`}>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50">
          <div
            className={`h-full bg-gradient-to-r ${colors[toast.type]} animate-shrink`}
            style={{
              animationDuration: `${toast.duration || 4000}ms`,
            }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${colors[toast.type]} flex items-center justify-center shadow-md`}>
            <span className="text-xl filter drop-shadow-sm">{icons[toast.type]}</span>
          </div>

          {/* Message */}
          <p className="flex-1 text-gray-700 font-medium text-sm leading-snug">
            {toast.message}
          </p>

          {/* Close button */}
          <button
            onClick={() => {
              setIsLeaving(true)
              setTimeout(() => onRemove(toast.id), 300)
            }}
            className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-white/50 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink {
          animation: shrink linear forwards;
        }
      `}</style>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
