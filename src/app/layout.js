import { Buffer } from 'buffer';
import './globals.css'

// Polyfill for browser
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}