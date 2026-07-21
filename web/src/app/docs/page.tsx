import { getTranslations } from "next-intl/server";
import { PixelPanel } from "@/components/ui/PixelPanel";

export default async function DocsPage() {
  const t = await getTranslations("docs");

  const sections = [
    { title: t("sectionLauncher"), body: t("launcherBody") },
    { title: t("sectionCurve"), body: t("curveBody") },
    { title: t("sectionGraduation"), body: t("graduationBody") },
  ];

  const feeRows: [string, string][] = [
    [t("feeRow1a"), t("feeRow1b")],
    [t("feeRow2a"), t("feeRow2b")],
    [t("feeRow3a"), t("feeRow3b")],
    [t("feeRow4a"), t("feeRow4b")],
    [t("feeRow5a"), t("feeRow5b")],
  ];

  const faqs: [string, string][] = [
    [t("faq1q"), t("faq1a")],
    [t("faq2q"), t("faq2a")],
    [t("faq3q"), t("faq3a")],
    [t("faq4q"), t("faq4a")],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-pixel text-xl text-robin">{t("title")}</h1>

      <div className="mt-8 flex flex-col gap-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-pixel text-sm text-white">▸ {s.title}</h2>
            <p className="mt-3 font-body text-xl leading-snug text-white/70">
              {s.body}
            </p>
          </section>
        ))}

        <section>
          <h2 className="font-pixel text-sm text-white">▸ {t("sectionFees")}</h2>
          <PixelPanel className="mt-3">
            <table className="w-full font-body text-xl">
              <thead>
                <tr className="border-b-2 border-black text-left font-pixel text-[9px] uppercase text-white/40">
                  <th className="px-4 py-2">{t("feeHead1")}</th>
                  <th className="px-4 py-2 text-right">{t("feeHead2")}</th>
                </tr>
              </thead>
              <tbody>
                {feeRows.map(([a, b]) => (
                  <tr key={a} className="border-b border-white/5">
                    <td className="px-4 py-2 text-white/80">{a}</td>
                    <td className="px-4 py-2 text-right text-robin tabular">
                      {b}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PixelPanel>
        </section>

        <section>
          <h2 className="font-pixel text-sm text-white">▸ {t("sectionFaq")}</h2>
          <div className="mt-3 flex flex-col gap-3">
            {faqs.map(([q, a]) => (
              <PixelPanel key={q} className="p-4">
                <div className="font-pixel text-[11px] text-robin">{q}</div>
                <p className="mt-2 font-body text-xl text-white/70">{a}</p>
              </PixelPanel>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-pixel text-sm text-danger">
            ▸ {t("sectionRisk")}
          </h2>
          <PixelPanel className="mt-3 border-danger p-4">
            <p className="font-body text-xl leading-snug text-white/70">
              {t("riskBody")}
            </p>
          </PixelPanel>
        </section>
      </div>
    </div>
  );
}
