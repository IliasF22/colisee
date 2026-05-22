import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { Swords, Trophy, Map as MapIcon } from "lucide-react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  title: "Colisée — L'arène des fast-foods",
  description:
    "Comparez, classez et géolocalisez vos fast-foods préférés dans des duels épiques.",
};

const navItems = [
  { href: "/duel", label: "L'Arène", icon: Swords },
  { href: "/classement", label: "Classement", icon: Trophy },
  { href: "/carte", label: "Carte", icon: MapIcon },
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-bd bg-bg/90 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
              <Link href="/" className="flex items-center gap-2.5 group">
                <Image
                  src="/images/logo-dark.png"
                  alt="Colisée"
                  width={32}
                  height={32}
                  className="rounded-md dark:hidden"
                />
                <Image
                  src="/images/logo-light.png"
                  alt="Colisée"
                  width={32}
                  height={32}
                  className="rounded-md hidden dark:block"
                />
                <span className="text-lg font-bold tracking-wider font-cinzel">
                  Colisée
                </span>
              </Link>

              <nav className="flex items-center gap-1 sm:gap-2">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] text-mt transition-colors hover:text-fg hover:bg-sf-hover"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                ))}
                <div className="h-4 w-px bg-bd mx-1" />
                <ThemeToggle />
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-bd">
            <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-5">
              <p className="text-[11px] text-mt">© {new Date().getFullYear()} Colisée</p>
              <p className="text-[11px] text-mt font-mono">v0.2.0</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
