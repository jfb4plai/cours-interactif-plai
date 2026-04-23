import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cours Interactif PLAI',
  description: 'Transformez vos cours en activités interactives pour vos élèves — PLAI, Fédération Wallonie-Bruxelles',
  icons: {
    icon: '/logo-plai.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-plai-cream text-plai-dark antialiased">
        {children}
      </body>
    </html>
  );
}
