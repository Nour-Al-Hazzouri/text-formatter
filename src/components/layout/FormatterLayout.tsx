'use client'

import { useState } from 'react'
import { MainLayout } from './MainLayout'

interface FormatterLayoutProps {
  children: React.ReactNode
}

export function FormatterLayout({ children }: FormatterLayoutProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('meeting-notes')

  const handleFormatSelect = (formatId: string) => {
    setSelectedFormat(formatId)
    // TODO: Implement format change logic
    console.log('Format selected:', formatId)
  }

  return (
    <MainLayout
      showSidebar={true}
      selectedFormat={selectedFormat}
      onFormatSelect={handleFormatSelect}
    >
      <div className="h-full overflow-hidden">
        {children}
      </div>
    </MainLayout>
  )
}
