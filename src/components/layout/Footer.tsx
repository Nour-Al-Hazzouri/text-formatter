import Link from 'next/link'
import { FileText, Github, Heart } from 'lucide-react'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`border-t border-orange-200/30 bg-gradient-to-r from-orange-50/50 to-amber-50/50 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-200/50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-handwritten font-semibold text-gray-900">
                Text Formatter
              </span>
            </div>
            <p className="text-sm font-content text-gray-600 leading-relaxed">
              Transform messy text into organized, readable formats with intelligent 
              pattern recognition. Built for productivity and powered by modern web technologies.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-handwritten font-semibold text-gray-900 uppercase tracking-wider">
              Features
            </h3>
            <ul className="space-y-2 text-sm font-content text-gray-600">
              <li>
                <Link href="/" className="hover:text-orange-600 transition-colors">
                  Meeting Notes
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-orange-600 transition-colors">
                  Task Lists
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-orange-600 transition-colors">
                  Journal & Notes
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-orange-600 transition-colors">
                  Shopping Lists
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-orange-600 transition-colors">
                  Research Notes
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-orange-600 transition-colors">
                  Study Notes
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-sm font-handwritten font-semibold text-gray-900 uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-2 text-sm font-content text-gray-600">
              <li>
                <Link href="/history" className="hover:text-orange-600 transition-colors">
                  Format History
                </Link>
              </li>
              <li>
                <Link href="/templates" className="hover:text-orange-600 transition-colors">
                  Custom Templates
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-orange-600 transition-colors">
                  Settings
                </Link>
              </li>
              <li>
                <a 
                  href="/docs" 
                  className="hover:text-orange-600 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="/privacy" 
                  className="hover:text-orange-600 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="text-sm font-handwritten font-semibold text-gray-900 uppercase tracking-wider">
              Connect
            </h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-orange-600 transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
            <p className="text-sm font-content text-gray-600">
              Open source and privacy-focused. 
              All processing happens locally in your browser.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-orange-200/30 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4 text-sm font-content text-gray-600">
            <span>© {currentYear} Text Formatter</span>
            <span>•</span>
            <span>Built with Next.js & TypeScript</span>
          </div>
          
          <div className="flex items-center space-x-1 text-sm font-content text-gray-600">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>for better productivity</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
