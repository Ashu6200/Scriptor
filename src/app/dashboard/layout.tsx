import { AppLayout } from "@/components/layout/AppLayout";
import { auth } from "@/server/infrastructure/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Script from "next/script";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <AppLayout>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {children}
    </AppLayout>
  );
}
