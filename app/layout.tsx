import type { Metadata, Viewport } from 'next'
import { Geist, Pixelify_Sans } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const pixelify = Pixelify_Sans({ subsets: ['latin'], variable: '--font-pixelify' })

export const metadata: Metadata = {
  title: {
    default: 'Towers RPG',
    template: '%s · Towers RPG',
  },
  description: 'Rules, character sheets and cards for the Towers tabletop roleplaying game.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eceff3' },
    { media: '(prefers-color-scheme: dark)', color: '#12151c' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${pixelify.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="pixel-grid flex min-h-dvh flex-col">
            <SiteHeader />
            <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-6 md:py-12">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
