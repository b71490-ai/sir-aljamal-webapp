import type { Metadata } from "next";
import OrderTrackingView from "@/components/order-tracking-view";

export const metadata: Metadata = {
  title: "تتبع الطلب | سر الجمال",
  description: "تابعي حالة طلبك في سر الجمال عبر رقم الطلب ومعرفة حالة الشحن والعناصر المسجلة.",
};

export default function TrackOrderPage() {
  return <OrderTrackingView />;
}
