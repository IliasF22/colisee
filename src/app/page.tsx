import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-6">
      <div className="flex flex-col items-center text-center max-w-xl animate-fade-in">
        <div className="relative mb-8">
          <Image
            src="/images/logo-dark.png"
            alt="Colisée"
            width={400}
            height={218}
            className="h-40 w-auto dark:invert"
            priority
          />
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-wide font-cinzel">
          Colisée
        </h1>
        <p className="mt-4 text-mt text-lg max-w-md">
          Votez pour vos fast-foods préférés. Classez-les. Trouvez les meilleurs.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/duel"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-fg px-6 py-2.5 text-sm font-medium text-bg transition-all hover:opacity-90"
          >
            Commencer un duel
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/classement"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-bd px-6 py-2.5 text-sm font-medium text-mt transition-colors hover:text-fg hover:bg-sf-hover"
          >
            Voir le classement
          </Link>
        </div>
      </div>
    </div>
  );
}
