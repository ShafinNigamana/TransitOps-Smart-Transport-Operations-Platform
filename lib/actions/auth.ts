"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

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

  try {
    const dbRes = await pool.query(
      "SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = $1 AND encrypted_password = crypt($2, encrypted_password)",
      [parsed.data.email, parsed.data.password]
    );

    if (dbRes.rows.length === 0) {
      return { error: "Invalid email or password." };
    }

    const user = dbRes.rows[0];
    const userRole = user.raw_user_meta_data?.role || "driver";
    const fullName = user.raw_user_meta_data?.full_name || "Operator";

    const payload = { userId: user.id, userRole, email: user.email, fullName };
    const value = Buffer.from(JSON.stringify(payload)).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set("transitops_session", value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    revalidatePath("/", "layout");
  } catch (err: any) {
    console.error("Login action error:", err);
    return { error: `Authentication failed: ${err.message || String(err)}` };
  }

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("transitops_session", "", { maxAge: 0, path: "/" });
  revalidatePath("/", "layout");
  redirect("/login");
}

const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["fleet_manager", "driver", "safety_officer", "financial_analyst"], {
    message: "Please select a valid role",
  }),
});

export async function signUp(formData: FormData): Promise<{ success?: boolean; message?: string; error?: string }> {
  try {
    const parsed = signupSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    });

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input";
      return { error: msg };
    }

    const checkUser = await pool.query("SELECT id FROM auth.users WHERE email = $1", [parsed.data.email]);
    if (checkUser.rows.length > 0) {
      return { error: "A user with this email address already exists." };
    }

    const meta = { full_name: parsed.data.fullName, role: parsed.data.role };
    const insertRes = await pool.query(
      "INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data) VALUES ($1, crypt($2, gen_salt('bf')), $3) RETURNING id",
      [parsed.data.email, parsed.data.password, JSON.stringify(meta)]
    );

    const userId = insertRes.rows[0].id;

    await pool.query(
      "INSERT INTO public.profiles (id, full_name, role) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
      [userId, parsed.data.fullName, parsed.data.role]
    );

    const payload = { userId, userRole: parsed.data.role, email: parsed.data.email, fullName: parsed.data.fullName };
    const value = Buffer.from(JSON.stringify(payload)).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set("transitops_session", value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    revalidatePath("/", "layout");
  } catch (err: any) {
    console.error("signUp action exception:", err);
    if (err.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: err.message || String(err) };
  }

  redirect("/dashboard");
}

const DEMO_PASSWORD = "demo123456";

const DEMO_ACCOUNTS: Record<string, string> = {
  fleet_manager: "fleet@transitops.com",
  driver: "driver@transitops.com",
  safety_officer: "safety@transitops.com",
  financial_analyst: "finance@transitops.com",
};

export async function demoLogin(role: string) {
  const email = DEMO_ACCOUNTS[role];
  if (!email) {
    return { error: "Unknown demo role" };
  }

  try {
    let dbRes = await pool.query(
      "SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = $1",
      [email]
    );

    let user;
    if (dbRes.rows.length === 0) {
      const fullName = role.replace("_", " ");
      const meta = { full_name: fullName, role };
      const insertRes = await pool.query(
        "INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data) VALUES ($1, crypt($2, gen_salt('bf')), $3) RETURNING id, email, raw_user_meta_data",
        [email, DEMO_PASSWORD, JSON.stringify(meta)]
      );
      user = insertRes.rows[0];

      await pool.query(
        "INSERT INTO public.profiles (id, full_name, role) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
        [user.id, fullName, role]
      );
    } else {
      user = dbRes.rows[0];
    }

    const userRole = user.raw_user_meta_data?.role || "driver";
    const fullName = user.raw_user_meta_data?.full_name || "Operator";

    const payload = { userId: user.id, userRole, email: user.email, fullName };
    const value = Buffer.from(JSON.stringify(payload)).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set("transitops_session", value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    revalidatePath("/", "layout");
  } catch (err: any) {
    console.error("demoLogin action exception:", err);
    return { error: err.message || String(err) };
  }

  redirect("/dashboard");
}

export async function assertRole(allowedRoles: string[]): Promise<{ success: boolean; role?: string; error?: any; user?: { id: string; email: string } }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("transitops_session");
    if (!sessionCookie || !sessionCookie.value) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User session is invalid. Please sign in." },
      };
    }

    const payload = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf8"));
    const role = payload.userRole || "driver";

    if (!allowedRoles.includes(role)) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Your role (${role.replace("_", " ")}) does not have permission to perform this action.`,
        },
      };
    }

    return { success: true, role, user: { id: payload.userId, email: payload.email } };
  } catch (e: any) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "User session is invalid. Please sign in." },
    };
  }
}
