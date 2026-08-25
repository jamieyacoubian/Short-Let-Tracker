import { googleConfigured, localCredentialsConfigured } from "@/auth";
import { credentialsSignIn, googleSignIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { KeyRound, Home } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "That username or access code wasn't recognised.",
  AccessDenied: "That Google account isn't authorised for this command centre.",
  Default: "Something went wrong signing you in — please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl = "/", error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-800 text-ivory-soft">
            <Home className="h-5 w-5" />
          </div>
          <h1 className="font-serif-display text-2xl font-medium text-forest-900">
            London Rental Command Centre
          </h1>
          <p className="text-sm text-ink-500">
            Private workspace for Jamie &amp; Margaret&rsquo;s short-let search. Sign in to continue.
          </p>
        </div>

        <div className="rounded-xl border border-border-soft bg-paper p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-md border border-clay-600/30 bg-clay-100 px-3 py-2 text-sm text-clay-600">
              {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default}
            </div>
          )}

          {googleConfigured && (
            <form action={googleSignIn} className="mb-4">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <Button type="submit" variant="outline" className="w-full">
                Continue with Google
              </Button>
            </form>
          )}

          {googleConfigured && localCredentialsConfigured && (
            <div className="my-4 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs uppercase tracking-wide text-ink-300">or</span>
              <Separator className="flex-1" />
            </div>
          )}

          {localCredentialsConfigured && (
            <form action={credentialsSignIn} className="flex flex-col gap-3">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" autoComplete="username" required defaultValue="jamie" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Access code</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
              <Button type="submit" className="mt-1 w-full">
                <KeyRound className="h-4 w-4" />
                Sign in
              </Button>
            </form>
          )}

          {!googleConfigured && !localCredentialsConfigured && (
            <p className="text-sm text-ink-500">
              No sign-in method is configured yet. Set <code className="rounded bg-ivory-soft px-1">ADMIN_PASSWORD</code>{" "}
              or Google OAuth credentials in <code className="rounded bg-ivory-soft px-1">.env</code> — see the README.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ink-300">
          Private &amp; unindexed. Your search data never leaves this workspace.
        </p>
      </div>
    </main>
  );
}
