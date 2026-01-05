import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard";

export const metadata = {
  title: "Dashboard | Gold-Finger",
  description: "Your expense tracking dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get display name from metadata or email
  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "there";

  return <DashboardContent displayName={displayName} />;
}
