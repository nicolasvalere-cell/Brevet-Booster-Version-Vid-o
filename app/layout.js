import './globals.css'

export const metadata = {
  title: 'Brevet Booster',
  description: 'Plateforme de révision brevet maths',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
