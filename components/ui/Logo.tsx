"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  isDark?: boolean
}

const Logo: React.FC<LogoProps> = ({ className = "h-8", isDark }) => {
  return (
    <div className="relative flex items-center h-full">
      <div className={`relative ${className} flex items-center justify-center transition-transform group-hover:scale-[1.03] active:scale-95`}>
        {!isDark && (
          <Image
            src="/think-logo-dark.png"
            alt="Think"
            width={160}
            height={56}
            className="h-full w-auto object-contain block drop-shadow-sm"
            priority
          />
        )}
        {isDark && (
          <Image
            src="/think-logo-white.png"
            alt="Think"
            width={160}
            height={56}
            className="h-full w-auto object-contain block drop-shadow-sm"
            priority
          />
        )}
      </div>

      <Link
        href="/blog/it"
        onClick={(e) => e.stopPropagation()}
        className="ml-1 flex flex-shrink-0 items-center gap-1.5 bg-gradient-to-tr from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all outline-none border border-white/20"
      >
        <span className="text-[11px] font-black uppercase tracking-widest leading-none mt-px">Blog</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </Link>
    </div>
  )
}

export default Logo
