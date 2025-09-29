import { MainLayout } from './MainLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface TemplateLayoutProps {
  children: React.ReactNode
}

export function TemplateLayout({ children }: TemplateLayoutProps) {
  return (
    <MainLayout showSidebar={false}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-handwritten font-bold text-gray-900 mb-2">
                Custom Templates
              </h1>
              <p className="text-lg font-content text-gray-600">
                Create and manage your custom formatting templates
              </p>
            </div>
            
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-200/50">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        <Card className="border-orange-200/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-b border-orange-200/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-handwritten font-semibold text-gray-900">
                  Your Templates
                </h2>
                <p className="text-sm font-content text-gray-600 mt-1">
                  Saved formatting patterns and custom rules
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {children}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
