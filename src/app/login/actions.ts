"use server";

import { signIn } from "@/auth";

export async function credentialsSignIn(formData: FormData) {
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";
  await signIn("local", {
    username: formData.get("username"),
    password: formData.get("password"),
    redirectTo: callbackUrl,
  });
}

export async function googleSignIn(formData: FormData) {
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";
  await signIn("google", { redirectTo: callbackUrl });
}
