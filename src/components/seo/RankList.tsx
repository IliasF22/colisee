import Link from "next/link";
import { Star } from "lucide-react";
import { SeoFastFood } from "@/lib/server-data";
import { FOOD_CATEGORIES } from "@/lib/categories";
import { priceLabel } from "@/lib/seo";

const catLabel = (id: string) => FOOD_CATEGORIES.find((c) => c.id === id);

/** Liste de classement (server component) — réutilisée par les pages SEO. */
export function RankList({
  items,
  showCity = false,
  showCategory = false,
}: {
  items: SeoFastFood[];
  showCity?: boolean;
  showCategory?: boolean;
}) {
  return (
    <ol className="flex flex-col gap-2">
      {items.map((f, i) => {
        const rank = i + 1;
        const cat = catLabel(f.category);
        return (
          <li key={f.id}>
            <Link
              href={`/restaurant/${f.slug}`}
              className="flex items-center gap-3 rounded-xl border border-bd bg-sf px-3 py-3 transition-colors hover:bg-sf-hover"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums ${
                  rank === 1
                    ? "bg-gld/15 text-gld"
                    : "bg-bg text-mt"
                }`}
              >
                {rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-fg">{f.name}</p>
                <p className="truncate text-[13px] text-mt">
                  {showCategory && cat ? `${cat.emoji} ${cat.label} · ` : ""}
                  {showCity ? `${f.cityName} · ` : ""}
                  {f.is_franchise && f.franchise_name ? `${f.franchise_name} · ` : ""}
                  <span className="text-gld">{priceLabel(f.price_level)}</span>
                </p>
              </div>
              {typeof f.google_rating === "number" && (
                <span className="flex shrink-0 items-center gap-1 text-[13px] text-mt">
                  <Star className="h-3.5 w-3.5 fill-gld text-gld" />
                  {f.google_rating.toFixed(1)}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
