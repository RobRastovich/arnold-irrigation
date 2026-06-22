'use client'

import { useState } from 'react'

interface WindowShadeProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  actionButton?: React.ReactNode
}

export default function WindowShade({ title, defaultOpen = false, children, actionButton }: WindowShadeProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="sf-window-shade">
      <div
        className="sf-window-shade-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`sf-window-shade-icon w-4 h-4 ${isOpen ? 'open' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="sf-window-shade-title">{title}</span>
        </div>
        {actionButton && (
          <div onClick={(e) => e.stopPropagation()}>
            {actionButton}
          </div>
        )}
      </div>
      <div className={`sf-window-shade-content ${isOpen ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  )
}
