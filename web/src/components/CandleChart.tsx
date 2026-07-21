"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { api } from "@/lib/api";
import type { Timeframe } from "@/lib/types";
import { PixelTabs } from "./ui/PixelTabs";

export function CandleChart({
  tokenAddress,
  color = "#CCFF00",
}: {
  tokenAddress: string;
  color?: string;
}) {
  const t = useTranslations("token");
  const [tf, setTf] = useState<Timeframe>("1h");
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const { data: candles } = useQuery({
    queryKey: ["candles", tokenAddress, tf],
    queryFn: () => api.candles(tokenAddress, tf),
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "#0A0A0F" },
        textColor: "rgba(255,255,255,0.55)",
        fontFamily: "'VT323', monospace",
        fontSize: 16,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.15)" },
      timeScale: { borderColor: "rgba(255,255,255,0.15)", timeVisible: true },
      crosshair: {
        vertLine: { color, labelBackgroundColor: color },
        horzLine: { color, labelBackgroundColor: color },
      },
      height: 380,
    });
    const series = chart.addCandlestickSeries({
      upColor: "#00FFB2",
      downColor: "#FF4D6D",
      wickUpColor: "#00FFB2",
      wickDownColor: "#FF4D6D",
      borderVisible: false,
      priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const onResize = () => chart.applyOptions({ width: el.clientWidth });
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [color]);

  useEffect(() => {
    if (!candles || !seriesRef.current) return;
    seriesRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-pixel text-[10px] uppercase text-white/60">
          {t("chart")}
        </span>
        <PixelTabs
          size="sm"
          active={tf}
          onChange={(id) => setTf(id as Timeframe)}
          tabs={[
            { id: "1m", label: t("tf1m") },
            { id: "5m", label: t("tf5m") },
            { id: "1h", label: t("tf1h") },
            { id: "1d", label: t("tf1d") },
          ]}
        />
      </div>
      <div
        ref={containerRef}
        className="w-full border-2 border-black shadow-pixel"
      />
    </div>
  );
}
