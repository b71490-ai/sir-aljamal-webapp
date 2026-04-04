import { unstable_noStore as noStore } from "next/cache";
import { NextResponse } from "next/server";
import { readServerAdminState } from "@/lib/server-admin-db";

function toPublicState(state: Awaited<ReturnType<typeof readServerAdminState>>) {
  return {
    revision: state.revision,
    updatedAt: state.updatedAt,
    products: state.products,
    offers: state.offers,
    settings: {
      whatsappNumber: state.settings.whatsappNumber,
      supportEmail: state.settings.supportEmail,
      brandLogoPath: state.settings.brandLogoPath,
      footerContactTitle: state.settings.footerContactTitle,
      workingHoursLabel: state.settings.workingHoursLabel,
      currencyCode: state.settings.currencyCode,
      currencySymbol: state.settings.currencySymbol,
      lowStockThreshold: state.settings.lowStockThreshold,
      smartMode: state.settings.smartMode,
      walletName: state.settings.walletName,
      walletAccountNumber: state.settings.walletAccountNumber,
      paymentMethods: state.settings.paymentMethods,
    },
  };
}

export async function GET() {
  noStore();
  const state = await readServerAdminState();

  return NextResponse.json(toPublicState(state), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
