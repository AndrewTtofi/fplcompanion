import '@/styles/globals.css'
import Head from 'next/head'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/context/ThemeContext'

const SITE_URL = 'https://fplcompanion.com';
const SITE_NAME = 'FPL Companion';
const DEFAULT_DESCRIPTION = 'Your Fantasy Premier League Dashboard — live points, team analysis, league standings, transfer planning, and gameweek insights for FPL managers.';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#37003c" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href={SITE_URL} />

        {/* Default SEO — pages can override these */}
        <title>{`${SITE_NAME} — Fantasy Premier League Dashboard`}</title>
        <meta name="description" content={DEFAULT_DESCRIPTION} />
        <meta name="keywords" content="FPL, Fantasy Premier League, FPL dashboard, FPL companion, FPL live points, FPL team analyzer, FPL league standings, FPL transfers, fantasy football, Premier League" />

        {/* Open Graph */}
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={`${SITE_NAME} — Fantasy Premier League Dashboard`} />
        <meta property="og:description" content={DEFAULT_DESCRIPTION} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${SITE_NAME} — Fantasy Premier League Dashboard`} />
        <meta name="twitter:description" content={DEFAULT_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
      </Head>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </ThemeProvider>
  )
}
