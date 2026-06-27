import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata = {
  title: 'RoomChores — Flat Chore Rotation',
  description: 'A calm, beautiful weekly chore rotation tracker for 4 flatmates.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RoomChores',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <div className="ambient-bg" />
        {children}
        <NavBar />
      </body>
    </html>
  );
}
