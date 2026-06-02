import './globals.css';

export const metadata = {
  metadataBase: new URL('https://fullstackdanish.netlify.app'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  title: 'Danish Aqib — Full Stack Engineer & AI Automation',
  description: 'I build production-ready web apps, AI integrations, and marketplaces for international clients. 4+ years, 15K+ users, shipped across 14 countries.',
  keywords: ['Full Stack Engineer', 'AI Integration', 'Web Development', 'SaaS', 'Marketplace Development', 'Freelance Developer', 'Next.js', 'React', 'Node.js', 'OpenAI'],
  authors: [{ name: 'Danish Aqib' }],
  openGraph: {
    title: 'Danish Aqib — Full Stack Engineer & AI Automation',
    description: 'I build production-ready web apps, AI integrations, and marketplaces for international clients.',
    url: 'https://fullstackdanish.netlify.app',
    siteName: 'Danish Aqib',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Danish Aqib — Full Stack Engineer & AI Automation',
    description: 'I build production-ready web apps, AI integrations, and marketplaces for international clients.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
