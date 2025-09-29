'use client'

import { useState } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  selectedFormat?: string
  onFormatSelect?: (formatId: string) => void
  className?: string
}

export function MainLayout({ 
  children, 
  showSidebar = false,
  selectedFormat,
  onFormatSelect,
  className 
}: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-orange-50/30 to-amber-50/30 ${className}`}>
      <Header 
        showFormatOptions={showSidebar}
        selectedFormat={selectedFormat}
        onFormatSelect={onFormatSelect}
      />
      
      <div className="flex flex-1 relative">
        {showSidebar && (
          <Sidebar
            selectedFormat={selectedFormat}
            onFormatSelect={onFormatSelect}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}
        
        <main className={`flex-1 overflow-hidden ${
          showSidebar 
            ? `md:${isSidebarCollapsed ? 'ml-16' : 'ml-80'} transition-all duration-300` 
            : ''
        }`}>
          {children}
        </main>
      </div>
      
      <Footer className={showSidebar ? `md:${isSidebarCollapsed ? 'ml-16' : 'ml-80'} transition-all duration-300` : ''} />
    </div>
  )
}
