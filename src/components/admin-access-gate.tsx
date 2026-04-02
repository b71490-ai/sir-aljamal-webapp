"use client";

import { useMemo, useState } from "react";
import AdminDashboard from "@/components/admin-dashboard";
import { getDashboardSettings } from "@/lib/admin-storage";

export default function AdminAccessGate() {
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");

  const expectedPin = useMemo(() => getDashboardSettings().adminPin, []);

  function handleUnlock() {
    if (pin.trim() !== expectedPin) {
      setError("رمز الدخول غير صحيح");
      return;
    }
    setError("");
    setIsUnlocked(true);
  }

  if (isUnlocked) {
    return <AdminDashboard />;
  }

  return (
    <main className="inner-page site-shell" dir="rtl">
      <section className="checkout-empty">
        <h2>دخول لوحة الإدارة</h2>
        <p>أدخلي رمز الدخول للوصول إلى البيانات الحساسة والتقارير.</p>
        <p className="mt-2 text-sm text-zinc-600">
          بعد الدخول استخدمي زر مزامنة من السيرفر لتحميل آخر البيانات المشتركة بين الأجهزة.
        </p>
        <div className="mt-3 flex w-full max-w-md flex-col gap-2">
          <input
            className="form-input"
            type="password"
            placeholder="رمز الدخول"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
          />
          {error ? <p className="text-sm font-black text-red-700">{error}</p> : null}
          <button className="hero-btn hero-btn--primary" type="button" onClick={handleUnlock}>
            دخول
          </button>
        </div>
      </section>
    </main>
  );
}
