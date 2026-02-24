import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center pt-[72px]">
      <Suspense fallback={<div className="text-muted">Loading...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
