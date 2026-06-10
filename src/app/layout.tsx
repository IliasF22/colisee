import type { Metadata } from "next";
import { SITE_URL, SEO_CATEGORIES } from "@/lib/seo";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { Swords, Trophy, Map as MapIcon, Lightbulb } from "lucide-react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider } from "@/lib/AuthContext";
import { AuthButton } from "@/components/AuthButton";
import { LocationProvider } from "@/lib/LocationContext";
import { HeaderLocation } from "@/components/HeaderLocation";
import { MobileNav } from "@/components/MobileNav";
import { ClickRipple } from "@/components/ClickRipple";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Colisée — Le classement des fast-foods en France",
    template: "%s",
  },
  description:
    "Le classement des meilleurs fast-foods de France (kebab, smash burger, tacos, poulet frit…) élu en duels par la communauté. Trouve le top près de chez toi.",
  applicationName: "Colisée",
  keywords: [
    "classement fast-food",
    "meilleur kebab",
    "meilleur smash burger",
    "meilleur tacos",
    "fast food France",
    "Colisée",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Colisée",
    title: "Colisée — Le classement des fast-foods en France",
    description:
      "Le classement des meilleurs fast-foods de France, élu en duels par la communauté.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Colisée — Le classement des fast-foods en France",
    description:
      "Le classement des meilleurs fast-foods de France, élu en duels par la communauté.",
  },
  robots: { index: true, follow: true },
};

const navItems = [
  { href: "/duel", label: "L'Arène", icon: Swords },
  { href: "/classement", label: "Classement", icon: Trophy },
  { href: "/carte", label: "Carte", icon: MapIcon },
  { href: "/suggestions", label: "Suggestions", icon: Lightbulb },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg text-fg transition-colors duration-200">
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <LocationProvider>
            <ClickRipple />
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-bd bg-bg/90 backdrop-blur-md">
              <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:px-5">
                {/* Gauche : menu mobile (dépliable) + logo */}
                <div className="flex items-center gap-2">
                  <MobileNav />
                  {/* Logo masqué sur mobile, un peu plus grand sur desktop */}
                  <Link href="/" className="hidden sm:flex items-center gap-2.5 group shrink-0">
                    {/* Logo noir en mode clair, blanc en mode sombre */}
                    <Image
                      src="/images/logo-noir.png"
                      alt="Colisée"
                      width={64}
                      height={64}
                      className="h-9 w-auto dark:hidden"
                    />
                    <Image
                      src="/images/logo-blanc.png"
                      alt="Colisée"
                      width={64}
                      height={64}
                      className="hidden h-9 w-auto dark:block"
                    />
                    <span className="text-lg font-bold tracking-wider font-cinzel">
                      Colisée
                    </span>
                  </Link>
                </div>

                {/* Droite : localisation + (nav desktop) + auth */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <HeaderLocation />
                  <nav className="hidden sm:flex items-center gap-1 sm:gap-2 border-l border-bd pl-2 sm:pl-3">
                    {navItems.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] text-mt transition-colors hover:text-fg hover:bg-sf-hover"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </nav>
                  <div className="hidden sm:block h-4 w-px bg-bd" />
                  <div className="hidden sm:block">
                    <ThemeToggle />
                  </div>
                  <div className="hidden sm:block h-4 w-px bg-bd" />
                  <AuthButton />
                </div>
              </div>
            </header>

            <main className="flex-1">{children}</main>

          <footer className="border-t border-bd">
            <div className="mx-auto max-w-7xl px-5 py-5">
              <nav aria-label="Classements par catégorie" className="flex flex-wrap gap-x-4 gap-y-1.5">
                {SEO_CATEGORIES.map((c) => (
                  <Link
                    key={c.id}
                    href={`/classement/${c.id}`}
                    className="text-[12px] text-mt transition-colors hover:text-fg"
                  >
                    {c.emoji} Top {c.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-bd pt-3">
                <div className="flex items-center gap-3">
                  <p className="text-[11px] text-mt">© {new Date().getFullYear()} Colisée</p>
                  <Link href="/mentions-legales" className="text-[11px] text-mt transition-colors hover:text-fg">
                    Mentions légales
                  </Link>
                  <Link href="/confidentialite" className="text-[11px] text-mt transition-colors hover:text-fg">
                    Confidentialité
                  </Link>
                </div>
                <p className="text-[11px] text-mt font-mono">v0.2.0</p>
              </div>
            </div>
          </footer>
            </LocationProvider>
        </ThemeProvider>
      </AuthProvider>
    </body>
  </html>
  );
}
