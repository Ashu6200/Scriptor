import { AdminLayout } from "@/components/admin/AdminLayout";
import { auth } from "@/server/infrastructure/auth";
import { prisma } from "@/server/infrastructure/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Mission Control — Scriptor Platform Admin",
  description: "Platform-level administration for Scriptor",
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { platformRole: true },
  });

  if (user?.platformRole !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminLayout>{children}</AdminLayout>;
}
