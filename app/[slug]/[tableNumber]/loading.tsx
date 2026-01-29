'use client'

export default function LoadingMenuPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
        <div className="text-sm font-semibold text-gray-600">
          Veuillez patienter… / الرجاء الانتظار…
        </div>
        <div className="text-xs text-gray-500">
          Chargement du menu… / جاري تحميل القائمة…
        </div>
      </div>
    </div>
  )
}

