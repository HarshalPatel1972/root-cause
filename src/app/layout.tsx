import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
};

export const metadata: Metadata = {
  title: 'Root Cause',
  description: 'Not just what changed. Why it changed.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased h-full`}
    >
      <body className="h-full bg-[var(--color-paper)] p-[14px]">
        {/* The Frame */}
        <div className="relative h-full w-full rounded-[4px] border-[3px] border-[var(--color-ink)] overflow-hidden flex flex-col">
          {/* Nav / Header */}
          <header className="flex-none p-6 flex justify-between items-center z-10 relative">
            <div className="flex items-center gap-2.5">
              {/* Debug breakpoint icon */}
              <span className="relative flex items-center justify-center w-5 h-5">
                <span className="absolute w-2.5 h-2.5 rounded-full bg-[var(--color-violet)]" />
                <span className="absolute w-2.5 h-2.5 rounded-full bg-[var(--color-violet)] animate-ping opacity-20" />
              </span>
              <span className="font-display font-semibold text-xl tracking-tight text-[var(--color-ink)]">
                Root Cause
              </span>
            </div>
            <nav className="font-sans font-medium text-sm flex gap-6">
              <a href="#" className="hover:text-[var(--color-violet)] transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-[var(--color-violet)] transition-colors">
                Portfolio
              </a>
            </nav>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto relative z-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
