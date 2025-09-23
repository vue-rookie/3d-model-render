import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: '3d模型在线渲染、自定义动画、专业级渲染效果',
  description: '3d模型在线渲染、自定义动画、专业级渲染效果',
  generator: '3dModelsOnline',
  keywords: ['3D模型', 'GLTF', 'GLB', 'Three.js', 'React Three Fiber', '3D渲染', '在线渲染', 'WebGL', '3D展示', 'Mars', '火星模型'],
  metadataBase: new URL('https://timebackward.com'),
  alternates: {
    canonical: '/demo',
  },
  openGraph: {
    type: 'website',
    url: 'https://timebackward.com/demo',
    title: '3D模型在线渲染演示 - 火星模型 | 3dModelsOnline',
    description: '在浏览器中实时加载与渲染3D模型，支持PBR材质、阴影与交互控制。',
    siteName: '3dModelsOnline',
    images: [{ url: '/favicon.png', width: 512, height: 512, alt: '3D模型在线渲染演示' }],
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@3dModelsOnline',
    creator: '@3dModelsOnline',
    title: '3D模型在线渲染演示 - 火星模型',
    description: 'WebGL/Three.js/React Three Fiber 实时渲染演示',
    images: ['/favicon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxSnippet: -1,
      maxImagePreview: 'large',
      maxVideoPreview: -1,
    },
  },
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-6182399611487556" />
        {/* JSON-LD 结构化数据：网站与组织 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '3dModelsOnline',
              url: 'https://timebackward.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://timebackward.com/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
              publisher: {
                '@type': 'Organization',
                name: '3dModelsOnline',
                url: 'https://timebackward.com',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://timebackward.com/favicon.png',
                },
              },
            }),
          }}
        />
        
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6182399611487556"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
