import { MainLayout } from './MainLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface HistoryLayoutProps {
  children: React.ReactNode
}

export function HistoryLayout({ children }: HistoryLayoutProps) {
  return (
    <MainLayout showSidebar={false}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-handwritten font-bold text-gray-900 mb-2">
            Format History
          </h1>
          <p className="text-lg font-content text-gray-600">
            View and manage your previous text formatting sessions
          </p>
        </div>

        <Card className="border-orange-200/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-b border-orange-200/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-handwritten font-semibold text-gray-900">
                  Recent Transformations
                </h2>
                <p className="text-sm font-content text-gray-600 mt-1">
                  Your formatting history and saved results
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
