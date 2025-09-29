'use client'

import { useState } from 'react'
import { 
  Users, 
  CheckSquare, 
  BookOpen, 
  ShoppingCart, 
  Search, 
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FormatOption {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  examples: string[]
}

interface SidebarProps {
  selectedFormat?: string
  onFormatSelect?: (formatId: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

const formatOptions: FormatOption[] = [
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Extract attendees, agenda items, and action items',
    icon: Users,
    color: 'bg-blue-500',
    examples: ['Attendees', 'Agenda Items', 'Action Items', 'Decisions']
  },
  {
    id: 'task-lists',
    name: 'Task Lists',
    description: 'Convert to organized todos with priorities',
    icon: CheckSquare,
    color: 'bg-green-500',
    examples: ['Todo Items', 'Priorities', 'Due Dates', 'Categories']
  },
  {
    id: 'journal-notes',
    name: 'Journal & Notes',
    description: 'Structure paragraphs and highlight insights',
    icon: BookOpen,
    color: 'bg-purple-500',
    examples: ['Paragraphs', 'Timestamps', 'Insights', 'Quotes']
  },
  {
    id: 'shopping-lists',
    name: 'Shopping Lists',
    description: 'Organize by categories and remove duplicates',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    examples: ['Categories', 'Quantities', 'Store Layout', 'Checkboxes']
  },
  {
    id: 'research-notes',
    name: 'Research Notes',
    description: 'Structure citations and references',
    icon: Search,
    color: 'bg-indigo-500',
    examples: ['Citations', 'Sources', 'Topics', 'References']
  },
  {
    id: 'study-notes',
    name: 'Study Notes',
    description: 'Convert to outlines and Q&A sections',
    icon: GraduationCap,
    color: 'bg-pink-500',
    examples: ['Outlines', 'Definitions', 'Q&A', 'Summaries']
  }
]

export function Sidebar({ 
  selectedFormat, 
  onFormatSelect, 
  isCollapsed = false,
  onToggleCollapse,
  className 
}: SidebarProps) {
  const [hoveredFormat, setHoveredFormat] = useState<string | null>(null)

  return (
    <aside className={`
      ${isCollapsed ? 'w-16' : 'w-80'} 
      flex-shrink-0 transition-all duration-300 ease-in-out
      bg-white border-r border-orange-200/30 
      fixed left-0 top-16 h-[calc(100vh-4rem)] z-40
      hidden md:flex
      ${className}
    `}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-orange-200/30">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-handwritten font-semibold text-gray-900">
                  Format Types
                </h2>
                <p className="text-sm font-content text-gray-600 mt-1">
                  Choose your formatting mode
                </p>
              </div>
            )}
            
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-8 w-8 p-0 text-gray-500 hover:text-orange-600"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
                <span className="sr-only">
                  {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Format Options */}
        <div className="flex-1 overflow-y-auto">
          <div className={`${isCollapsed ? 'p-2' : 'p-4'} space-y-3`}>
            {formatOptions.map((format) => {
              const Icon = format.icon
              const isSelected = selectedFormat === format.id
              const isHovered = hoveredFormat === format.id

              return isCollapsed ? (
                // Collapsed state - just icon button
                <button
                  key={format.id}
                  className={`
                    w-10 h-10 rounded-lg ${format.color} 
                    flex items-center justify-center 
                    cursor-pointer transition-all duration-200
                    ${isSelected ? 'shadow-lg ring-2 ring-orange-400 ring-offset-2' : 'shadow-md hover:shadow-lg'}
                    relative group
                  `}
                  onClick={() => onFormatSelect?.(format.id)}
                  onMouseEnter={() => setHoveredFormat(format.id)}
                  onMouseLeave={() => setHoveredFormat(null)}
                  title={format.name}
                >
                  <Icon className="w-5 h-5 text-white" />
                  
                  {/* Tooltip for collapsed state */}
                  {isHovered && (
                    <div className="absolute left-full top-0 ml-2 z-50 w-72 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                      <h4 className="font-handwritten font-medium text-gray-900 mb-1">
                        {format.name}
                      </h4>
                      <p className="text-sm font-content text-gray-600 mb-2">
                        {format.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {format.examples.map((example, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs font-content bg-gray-100 text-gray-600 rounded-md"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              ) : (
                // Expanded state - full card
                <Card
                  key={format.id}
                  className={`
                    cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'ring-2 ring-orange-400 border-orange-300 bg-orange-50' 
                      : 'hover:border-orange-200 hover:shadow-md'
                    }
                    ${isHovered && !isSelected ? 'border-orange-200 shadow-sm' : ''}
                  `}
                  onClick={() => onFormatSelect?.(format.id)}
                  onMouseEnter={() => setHoveredFormat(format.id)}
                  onMouseLeave={() => setHoveredFormat(null)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`
                        w-10 h-10 rounded-lg ${format.color} 
                        flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'shadow-lg' : 'shadow-md'}
                      `}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-handwritten font-medium text-gray-900 text-sm">
                            {format.name}
                          </h3>
                          {isSelected && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs font-content text-gray-600 mb-3 leading-relaxed">
                          {format.description}
                        </p>

                        {/* Examples */}
                        <div className="flex flex-wrap gap-1">
                          {format.examples.map((example, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 text-xs font-content bg-gray-100 text-gray-600 rounded-md"
                            >
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-orange-200/30">
            <div className="text-xs font-content text-gray-500 space-y-1">
              <p>💡 Select a format type to get started</p>
              <p>🤖 Auto-detection will suggest the best format</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
