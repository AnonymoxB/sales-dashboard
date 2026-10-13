import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;   // ← TAMBAH INI

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}