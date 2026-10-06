import type { Metadata } from "next";
import { API_URL, getExport } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DivCards", template: "%s · DivCards" },
  description: "Path of Exile Divination Card Index, estimate drop rates and track weight changes across leagues.",
  icons: { icon: `${API_URL}/images/favicon.png` },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { meta } = await getExport();
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preload" href="/fonts/Fontin-SmallCaps.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60 sticky top-0 z-20">
          {/* Three columns: logo, nav centred on the page, and an empty side to balance it.
              Phones: logo left, nav right. */}
          <div className="mx-auto flex h-14 max-w-7xl items-stretch justify-between gap-3 px-4 sm:gap-6 sm:grid sm:grid-cols-[1fr_auto_1fr]">
            <Logo icon={meta.assets.favicon} />
            <NavLinks />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <SiteFooter meta={meta} />
      </body>
    </html>
  );
}
