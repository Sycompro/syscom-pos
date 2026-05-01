import './globals.css'

export const metadata = {
  title: 'Syscom Ventas | Consulta Premium',
  description: 'Plataforma de consulta de ventas y stock en tiempo real para Syscom.',
}

import { Providers } from '../components/Providers'

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
