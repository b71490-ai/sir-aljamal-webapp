"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "@/components/admin-dashboard";
import { normalizeToEnglishDigits } from "@/lib/digits";

type AdminRole = "owner" | "staff" | "support";

export default function AdminAccessGate() {
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<AdminRole>("staff");

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth", { method: "GET", cache: "no-store" });
        const payload = (await response.json()) as { isAuthenticated?: boolean; role?: AdminRole | null };
        if (isMounted) {
          setIsUnlocked(Boolean(payload.isAuthenticated));
          if (payload.role) {
            setRole(payload.role);
          }
        }
      } catch {
        if (isMounted) {
          setIsUnlocked(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleUnlock() {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin: pin.trim(), role }),
      });

      if (!response.ok) {
        setError("رمز الدخول غير صحيح");
        return;
      }

      setError("");
    } catch {
      setError("تعذر تسجيل الدخول الآن. حاولي مرة أخرى.");
      return;
    } finally {
      setIsSubmitting(false);
    }

    setIsUnlocked(true);
  }

  if (isLoading) {
    return (
      <main className="inner-page site-shell" dir="rtl">
        <section className="checkout-empty">
          <h2>جارٍ تجهيز لوحة الإدارة...</h2>
        </section>
      </main>
    );
  }

  if (isUnlocked) {
    return <AdminDashboard role={role} />;
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
          <select
            className="form-input"
            value={role}
            onChange={(event) => setRole(event.target.value as AdminRole)}
          >
            <option value="staff">موظف</option>
            <option value="support">دعم</option>
            <option value="owner">مالك</option>
          </select>
          <input
            className="form-input"
            type="password"
            placeholder="رمز الدخول"
            value={pin}
            onChange={(event) => setPin(normalizeToEnglishDigits(event.target.value))}
          />
          {error ? <p className="text-sm font-black text-red-700">{error}</p> : null}
          <button className="hero-btn hero-btn--primary" type="button" onClick={() => void handleUnlock()}>
            {isSubmitting ? "جارٍ التحقق..." : "دخول"}
          </button>
        </div>
      </section>
    </main>
  );
}
