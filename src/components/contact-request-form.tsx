"use client";

import { FormEvent, useMemo, useState } from "react";
import { addAdminLead } from "@/lib/admin-storage";
import { pushAdminStateToServer } from "@/lib/admin-sync";
import { getCustomerProfile, saveCustomerProfile } from "@/lib/storefront-storage";
import { normalizeToEnglishDigits } from "@/lib/digits";
import { useDashboardSettingsLive } from "@/lib/use-dashboard-settings-live";

type ContactRequestFormProps = {
  selectedProductName?: string;
};

function getInitialContactProfile() {
  if (typeof window === "undefined") {
    return {
      name: "",
      phone: "",
      profileType: "",
    };
  }

  const profile = getCustomerProfile();
  return {
    name: profile.name || "",
    phone: profile.phone || "",
    profileType: profile.city || "",
  };
}

export default function ContactRequestForm({ selectedProductName }: ContactRequestFormProps) {
  const initialProfile = getInitialContactProfile();
  const [name, setName] = useState(initialProfile.name);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [profileType, setProfileType] = useState(initialProfile.profileType);
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const settings = useDashboardSettingsLive();
  const whatsappNumber = settings.whatsappNumber;

  const waBaseUrl = useMemo(() => `https://wa.me/${whatsappNumber}`, [whatsappNumber]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setErrorMessage("يرجى إدخال الاسم.");
      return;
    }
    if (!/^(\+?967|0)?7\d{8}$/.test(normalizeToEnglishDigits(phone).replace(/\s+/g, ""))) {
      setErrorMessage("رقم الجوال غير صحيح.");
      return;
    }

    setErrorMessage("");

    const lead = addAdminLead({
      name,
      phone,
      profileType,
      notes,
      priority,
      channel: "form",
      selectedProductName,
    });

    saveCustomerProfile({
      ...getCustomerProfile(),
      name,
      phone,
      city: getCustomerProfile().city,
    });

    setSuccessMessage(`تم تسجيل طلبك بنجاح. رقم التذكرة: ${lead.ticketNumber}`);
    void pushAdminStateToServer();

    const messageLines = [
      "مرحبًا، أريد استشارة من سر الجمال",
      `رقم التذكرة: ${lead.ticketNumber}`,
      selectedProductName ? `المنتج المطلوب: ${selectedProductName}` : null,
      `الاسم: ${name}`,
      `الجوال: ${phone}`,
      `نوع البشرة/الشعر: ${profileType || "غير محدد"}`,
      `الأولوية: ${priority}`,
      notes ? `ملاحظات: ${notes}` : null,
    ].filter(Boolean);

    const url = `${waBaseUrl}?text=${encodeURIComponent(messageLines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={handleSubmit}>
      {successMessage ? (
        <p className="sm:col-span-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-black text-green-800">
          {successMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-black text-red-700">
          {errorMessage}
        </p>
      ) : null}
      <input
        className="form-input"
        type="text"
        placeholder="الاسم"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <input
        className="form-input"
        type="tel"
        placeholder="رقم الجوال"
        value={phone}
        onChange={(event) => setPhone(normalizeToEnglishDigits(event.target.value))}
        required
      />
      <input
        className="form-input sm:col-span-2"
        type="text"
        placeholder="نوع البشرة أو الشعر"
        value={profileType}
        onChange={(event) => setProfileType(event.target.value)}
      />
      <select
        className="form-input sm:col-span-2"
        value={priority}
        onChange={(event) => setPriority(event.target.value as "low" | "medium" | "high")}
      >
        <option value="low">أولوية منخفضة</option>
        <option value="medium">أولوية متوسطة</option>
        <option value="high">أولوية عالية</option>
      </select>
      <textarea
        className="form-input sm:col-span-2"
        placeholder="ملاحظاتك"
        rows={4}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <button className="hero-btn hero-btn--primary sm:col-span-2" type="submit">
        ارسال الطلب عبر واتساب
      </button>
    </form>
  );
}
