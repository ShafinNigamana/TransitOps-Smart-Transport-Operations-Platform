"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    return { error: msg };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// Demo persona accounts — pre-seeded in Supabase Auth
// These use a shared password so judges can quick-switch roles during the demo.
const DEMO_PASSWORD = "demo123456";

const DEMO_ACCOUNTS: Record<string, string> = {
  fleet_manager: "fleet@transitops.demo",
  driver: "driver@transitops.demo",
  safety_officer: "safety@transitops.demo",
  financial_analyst: "finance@transitops.demo",
};

export async function demoLogin(role: string) {
  const email = DEMO_ACCOUNTS[role];
  if (!email) {
    return { error: "Unknown demo role" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });

  if (error) {
    // If demo accounts aren't seeded yet, sign up on the fly then sign in
    if (error.message.includes("Invalid login")) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: DEMO_PASSWORD,
        options: {
          data: { full_name: role.replace("_", " "), role },
        },
      });

      if (signUpError) {
        return { error: `Demo setup failed: ${signUpError.message}` };
      }

      // Try sign in again after signup
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password: DEMO_PASSWORD,
      });

      if (retryError) {
        return { error: `Demo login failed: ${retryError.message}` };
      }
    } else {
      return { error: error.message };
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
