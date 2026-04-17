import { Modak, Nunito, Ballet } from 'next/font/google'
import './globals.css'

const modak = Modak({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-modak',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
})

const ballet = Ballet({
  subsets: ['latin'],
  variable: '--font-ballet',
})

export const metadata = {
  title: 'Catstac',
  description: 'Vote for your favorite cat of the day.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${modak.variable} ${nunito.variable} ${ballet.variable}`}>
        {children}
      </body>
    </html>
  )
}