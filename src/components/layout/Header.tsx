'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, FileText, Settings, History, BookTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  className?: string
  showFormatOptions?: boolean
  selectedFormat?: string
  onFormatSelect?: (formatId: string) => void
}

export function Header({ 
  className, 
  showFormatOptions = false,
  selectedFormat,
  onFormatSelect 
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { href: '/', label: 'Formatter', icon: FileText },
    { href: '/history', label: 'History', icon: History },
    { href: '/templates', label: 'Templates', icon: BookTemplate },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const formatOptions = [
    { id: 'meeting-notes', name: 'Meeting Notes', icon: '👥' },
    { id: 'task-lists', name: 'Task Lists', icon: '✅' },
    { id: 'journal-notes', name: 'Journal & Notes', icon: '📖' },
    { id: 'shopping-lists', name: 'Shopping Lists', icon: '🛒' },
    { id: 'research-notes', name: 'Research Notes', icon: '🔍' },
    { id: 'study-notes', name: 'Study Notes', icon: '🎓' },
  ]

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-orange-200/30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-200/50 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </div>
              <div>
                <h1 className="text-xl font-handwritten font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Text Formatter
                </h1>
                <p className="text-xs text-gray-500 font-content hidden sm:block">
                  Intelligent text organization
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-9 w-9 p-0 text-gray-600 hover:text-orange-600 hover:bg-orange-50"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-orange-200/30 bg-white/95 backdrop-blur">
            <nav className="py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Link>
                )
              })}
              
              {/* Format Options in Mobile Menu */}
              {showFormatOptions && (
                <>
                  <div className="px-4 py-2 text-sm font-handwritten font-semibold text-gray-900 border-t border-orange-200/30 mt-4 pt-4">
                    Format Types
                  </div>
                  {formatOptions.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => {
                        onFormatSelect?.(format.id)
                        setIsMobileMenuOpen(false)
                      }}
                      className={`
                        w-full flex items-center px-4 py-2 text-left transition-colors
                        ${selectedFormat === format.id
                          ? 'text-orange-600 bg-orange-50 border-r-2 border-orange-400'
                          : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                        }
                      `}
                    >
                      <span className="w-4 h-4 mr-3 flex items-center justify-center text-sm">
                        {format.icon}
                      </span>
                      {format.name}
                    </button>
                  ))}
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
