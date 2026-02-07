import '@/styles/globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/context/ThemeContext'

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </ThemeProvider>
  )
}
