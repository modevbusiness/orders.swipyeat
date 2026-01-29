export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* Logo / Illustration */}
        <div className="relative mb-8">
          <div className="text-8xl mb-4">🍽️</div>
          <div className="absolute top-0 right-1/4 text-3xl animate-bounce" style={{ animationDelay: '0ms' }}>✨</div>
          <div className="absolute top-8 left-1/4 text-2xl animate-bounce" style={{ animationDelay: '200ms' }}>🌟</div>
        </div>

        {/* Welcome Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-orange-100">
          {/* Brand */}
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-amber-500 mb-2">
            SwipyEat
          </h1>
          
          <p className="text-gray-500 text-sm mb-6">Digital Menu Solutions</p>

          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Bienvenue ! 👋
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Transformez l&apos;expérience de vos clients avec nos menus digitaux interactifs et modernes.
            </p>
          </div>

          {/* CTA Button */}
          <a
            href="https://swipyeat.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 bg-linear-to-r from-orange-500 to-amber-500 text-white font-bold text-lg rounded-2xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Découvrir SwipyEat</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl mb-1">📱</div>
                <p className="text-xs text-gray-500">Menu Digital</p>
              </div>
              <div>
                <div className="text-2xl mb-1">⚡</div>
                <p className="text-xs text-gray-500">Commandes Rapides</p>
              </div>
              <div>
                <div className="text-2xl mb-1">🌍</div>
                <p className="text-xs text-gray-500">Multi-langues</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative food emojis */}
        <div className="mt-8 flex justify-center gap-4 text-3xl opacity-40">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🍕</span>
          <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🍔</span>
          <span className="animate-bounce" style={{ animationDelay: '200ms' }}>🍣</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🥗</span>
          <span className="animate-bounce" style={{ animationDelay: '400ms' }}>🍰</span>
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} SwipyEat. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
