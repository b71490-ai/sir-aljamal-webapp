"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getActiveOffers, getSecondsLeft } from "@/data/offers";

type AdItem = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  metaOne: string;
  metaTwo: string;
  cta: string;
  href: string;
  tone: string;
};

const AUTO_PLAY_MS = 4500;

const TONES = ["from-orange-500 to-rose-500", "from-rose-500 to-fuchsia-500", "from-amber-500 to-orange-500"];

function formatLeft(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}س ${m}د`;
}

export default function AdsSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [now, setNow] = useState(new Date());
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const ADS = useMemo<AdItem[]>(() => {
    const offers = getActiveOffers(now).slice(0, 3);
    return offers.map((offer, index) => ({
      id: offer.id,
      badge: offer.badge,
      title: offer.title,
      subtitle: offer.details,
      metaOne: offer.couponCode ? `كود ${offer.couponCode}` : "تطبيق تلقائي",
      metaTwo: `ينتهي خلال ${formatLeft(getSecondsLeft(offer.expiresAt, now))}`,
      cta: "شاهد التفاصيل",
      href: offer.href,
      tone: TONES[index % TONES.length],
    }));
  }, [now]);

  const lastIndex = ADS.length - 1;
  const boundedIndex = ADS.length === 0 ? 0 : Math.min(activeIndex, lastIndex);

  const goNext = useCallback(() => {
    if (ADS.length === 0) {
      return;
    }
    setActiveIndex((prev) => (prev === lastIndex ? 0 : prev + 1));
  }, [ADS.length, lastIndex]);

  const goPrev = useCallback(() => {
    if (ADS.length === 0) {
      return;
    }
    setActiveIndex((prev) => (prev === 0 ? lastIndex : prev - 1));
  }, [ADS.length, lastIndex]);

  useEffect(() => {
    if (isPaused || ADS.length === 0) {
      return;
    }

    const intervalId = window.setInterval(goNext, AUTO_PLAY_MS);
    return () => window.clearInterval(intervalId);
  }, [ADS.length, goNext, isPaused]);

  const trackStyle = useMemo(
    () => ({ transform: `translateX(-${boundedIndex * 100}%)` }),
    [boundedIndex],
  );

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < 40) {
      return;
    }

    if (deltaX < 0) {
      goNext();
      return;
    }

    goPrev();
  };

  return (
    <section
      className="ad-slider animate-slide-up"
      aria-label="سلايدر الاعلانات"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="ad-slider__viewport">
        {ADS.length === 0 ? (
          <article className="ad-slider__slide">
            <div className="ad-slider__card bg-gradient-to-l from-zinc-700 to-zinc-500">
              <span className="ad-slider__badge">لا توجد عروض نشطة حاليًا</span>
              <h2 className="ad-slider__title">سيتم تحديث العروض قريبًا</h2>
              <p className="ad-slider__subtitle">تابعي صفحة العروض لمعرفة آخر التحديثات.</p>
              <div className="ad-slider__actions">
                <Link className="ad-slider__cta" href="/offers">
                  صفحة العروض
                </Link>
              </div>
            </div>
          </article>
        ) : null}
        <div className="ad-slider__track" style={trackStyle}>
          {ADS.map((ad) => (
            <article key={ad.id} className="ad-slider__slide">
              <div className={`ad-slider__card bg-gradient-to-l ${ad.tone}`}>
                <p className="ad-slider__serial">{ad.id.slice(0, 6)}</p>
                <span className="ad-slider__badge">{ad.badge}</span>
                <h2 className="ad-slider__title">{ad.title}</h2>
                <p className="ad-slider__subtitle">{ad.subtitle}</p>
                <div className="ad-slider__meta">
                  <span>{ad.metaOne}</span>
                  <span>{ad.metaTwo}</span>
                </div>
                <div className="ad-slider__actions">
                  <Link className="ad-slider__cta" href={ad.href}>
                    {ad.cta}
                  </Link>
                  <Link className="ad-slider__cta ad-slider__cta--ghost" href="/store">
                    كل المنتجات
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="ad-slider__controls">
        <button
          aria-label="السابق"
          className="ad-slider__arrow"
          onClick={goPrev}
          type="button"
        >
          ‹
        </button>

        <div className="ad-slider__dots" aria-label="مؤشرات السلايدر">
          {ADS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`انتقال للشريحة ${index + 1}`}
              aria-current={index === boundedIndex}
              className={`ad-slider__dot ${index === boundedIndex ? "is-active" : ""}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>

        <button
          aria-label="التالي"
          className="ad-slider__arrow"
          onClick={goNext}
          type="button"
        >
          ›
        </button>
      </div>
    </section>
  );
}
