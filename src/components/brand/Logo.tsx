export function LogoIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="QCMed Logo"
    >
      <defs>
        <linearGradient id="qcmed-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="pulse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      {/* Fond fluide avec arrondi moderne */}
      <rect width="48" height="48" rx="14" fill="url(#qcmed-grad)" />

      {/* Anneau du Q */}
      <circle
        cx="22"
        cy="22"
        r="10.5"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        className="opacity-95"
      />

      {/* Onde ECG qui traverse le centre et forme la queue du Q */}
      <path
        d="M 12 22 L 17 22 L 19.5 15 L 23 28 L 26.5 18 L 28.5 22 L 31.5 22 L 36.5 32"
        stroke="url(#pulse-grad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Point de fin de pulsation */}
      <circle cx="36.5" cy="32" r="2" fill="white" />
    </svg>
  )
}

export function Logo({
  iconSize = "w-9 h-9",
  textSize = "text-2xl",
  showText = true,
}: {
  iconSize?: string
  textSize?: string
  showText?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 group select-none">
      <div className="transition-transform duration-200 group-hover:scale-105 shadow-md shadow-teal-500/20 rounded-2xl shrink-0">
        <LogoIcon className={iconSize} />
      </div>
      {showText && (
        <span className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${textSize}`}>
          QC<span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400 dark:from-teal-400 dark:to-emerald-300 bg-clip-text text-transparent">Med</span>
        </span>
      )}
    </div>
  )
}
