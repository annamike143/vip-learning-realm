// --- src/app/layout.js (VIP Learning Realm) ---
import "./globals.css";
import './lib/SharedComponents.css';
import './lib/errorHandling.css';
import { Inter, Poppins } from 'next/font/google';
import ErrorBoundary from './shared/components/ErrorBoundary';
import { AppStateProvider } from './lib/AppStateContext';
import { ErrorProvider, ErrorNotifications } from './lib/errorHandling';
import { MonitoringProvider, RealUserMonitoring } from './lib/monitoring';
import { PerformanceMonitor, registerServiceWorker } from './lib/performanceOptimization';
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-body', 
  display: 'swap',
  preload: true
});

const poppins = Poppins({ 
  subsets: ['latin'], 
  variable: '--font-heading', 
  weight: ['600', '700'], 
  display: 'swap',
  preload: true
});
export const metadata = {
  title: "The Mike Salazar Academy | VIP Learning Portal",
  description: "Exclusive premium educational platform featuring AI-powered learning, personalized instruction, and advanced course progression for VIP members.",
  keywords: "VIP education, premium learning, AI tutoring, Mike Salazar Academy, personalized instruction, online courses, exclusive training",
  authors: [{ name: "The Mike Salazar Academy" }],
  creator: "The Mike Salazar Academy",
  publisher: "The Mike Salazar Academy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://learning.mikesalazaracademy.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "VIP Learning Portal | The Mike Salazar Academy",
    description: "Access exclusive premium courses with AI-powered learning, personalized instruction, and advanced progress tracking. Join the VIP learning experience.",
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://learning.mikesalazaracademy.com',
    siteName: "The Mike Salazar Academy",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'The Mike Salazar Academy VIP Learning Portal',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "VIP Learning Portal | The Mike Salazar Academy",
    description: "Access exclusive premium courses with AI-powered learning and personalized instruction.",
    site: '@MikeSalazarAcad',
    creator: '@MikeSalazarAcad',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,
  },
};
export default function RootLayout({ children }) {
  // Register service worker for performance and offline functionality
  if (typeof window !== 'undefined') {
    registerServiceWorker();
  }

  return (
    <html lang="en">
      <head>
        <link rel="preload" href="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLDD4Z1xlFQ.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <MonitoringProvider>
          <ErrorProvider>
            <AppStateProvider>
              <ErrorBoundary>
                <PerformanceMonitor>
                  {children}
                  <ErrorNotifications />
                  <RealUserMonitoring />
                </PerformanceMonitor>
              </ErrorBoundary>
            </AppStateProvider>
          </ErrorProvider>
        </MonitoringProvider>
      </body>
    </html>
  );
}