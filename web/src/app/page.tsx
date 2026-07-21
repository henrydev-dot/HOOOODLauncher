"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { compact } from "@/lib/format";
import { MASCOTS } from "@/components/mascots";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelBadge } from "@/components/ui/PixelBadge";
import { LauncherCard } from "@/components/LauncherCard";

const PARADE_COLORS = ["#CCFF00", "#00FFB2", "#FF4D6D", "#00CFFF", "#FF9E00", "#C77DFF"];

function MascotParade() {
  const doubled = [...MASCOTS, ...MASCOTS];
  return (
    <div className="overflow-hidden border-y-2 border-black bg-black/40 py-4">
      <div className="flex w-max animate-marquee gap-10 px-4">
        {doubled.map((m, i) => (
          <div
            key={`${m.id}-${i}`}
            className="mascot-idle"
            style={{ animationDelay: `${(i % 7) * 0.2}s` }}
          >
            <m.Component
              size={56}
              color={PARADE_COLORS[i % PARADE_COLORS.length]}
              still
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: api.stats });
  const { data: launchers } = useQuery({
    queryKey: ["launchers"],
    queryFn: api.launchers,
  });

  const trending = (launchers ?? [])
    .slice()
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 3);

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 pb-12 pt-16 text-center">
          <PixelBadge tone="robin">{t("heroBadge")}</PixelBadge>
          <h1
            className="font-pixel text-2xl leading-relaxed text-white md:text-4xl md:leading-relaxed"
            style={{ textShadow: "4px 4px 0 #000, 6px 6px 0 rgba(204,255,0,0.35)" }}
          >
            {t("heroTitle")}
          </h1>
          <p className="max-w-2xl font-body text-2xl text-white/70">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/create">
              <PixelButton size="lg">{t("cta")}</PixelButton>
            </Link>
            <Link href="/explore">
              <PixelButton size="lg" variant="ghost">
                {t("ctaSecondary")}
              </PixelButton>
            </Link>
          </div>
        </div>
        <MascotParade />
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: t("statsLaunchers"), value: stats?.totalLaunchers },
            { label: t("statsTokens"), value: stats?.totalTokens },
            {
              label: t("statsVolume"),
              value: stats ? `${compact(stats.totalVolumeHoodie)} HOODIE` : undefined,
            },
            { label: t("statsGraduated"), value: stats?.graduatedTokens },
          ].map((s, i) => (
            <PixelPanel key={i} className="p-4 text-center">
              <div className="font-pixel text-lg text-robin tabular md:text-xl">
                {s.value ?? "…"}
              </div>
              <div className="mt-2 font-body text-lg uppercase text-white/50">
                {s.label}
              </div>
            </PixelPanel>
          ))}
        </div>
      </section>

      {/* TRENDING */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-pixel text-sm uppercase text-white">
            🔥 {t("trendingTitle")}
          </h2>
          <Link
            href="/explore"
            className="font-pixel text-[10px] uppercase text-robin hover:animate-blink"
          >
            {tc("viewAll")} →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((l) => (
            <LauncherCard key={l.slug} launcher={l} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="mb-4 font-pixel text-sm uppercase text-white">
          {t("howTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "01", title: t("how1Title"), desc: t("how1Desc") },
            { n: "02", title: t("how2Title"), desc: t("how2Desc") },
            { n: "03", title: t("how3Title"), desc: t("how3Desc") },
          ].map((s) => (
            <PixelPanel key={s.n} className="p-5">
              <div className="font-pixel text-2xl text-robin/30">{s.n}</div>
              <div className="mt-2 font-pixel text-xs text-white">{s.title}</div>
              <p className="mt-2 font-body text-lg text-white/60">{s.desc}</p>
            </PixelPanel>
          ))}
        </div>
      </section>

      {/* FEE TABLE */}
      <section className="mx-auto max-w-3xl px-4 py-10">
        <PixelPanel title={t("feeTitle")}>
          <table className="w-full font-body text-xl">
            <thead>
              <tr className="border-b-2 border-black text-left font-pixel text-[9px] uppercase text-white/40">
                <th className="px-4 py-2">{t("feeAction")}</th>
                <th className="px-4 py-2 text-right">{t("feeAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {[
                [t("feeLauncherCreate"), "50,000 HOODIE"],
                [t("feeTokenCreate"), "500 HOODIE"],
                [t("feeTrade"), t("feeTradeValue")],
                [t("feeGraduation"), t("feeGraduationValue")],
                [t("feeGraduateCaller"), t("feeGraduateCallerValue")],
              ].map(([a, b], i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="px-4 py-2 text-white/80">{a}</td>
                  <td className="px-4 py-2 text-right text-robin tabular">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PixelPanel>
      </section>

      {/* MASCOT CREW */}
      <section className="mx-auto max-w-5xl px-4 py-10 text-center">
        <h2 className="mb-6 font-pixel text-sm uppercase text-white">
          {t("mascotTitle")}
        </h2>
        <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6">
          {MASCOTS.map((m, i) => (
            <div key={m.id} className="flex flex-col items-center gap-2">
              <m.Component
                size={64}
                color={PARADE_COLORS[i % PARADE_COLORS.length]}
              />
              <span className="font-body text-base text-white/50">{m.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
