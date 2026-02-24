import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100svh-6rem)] pb-16 pt-24">
      <Suspense fallback={<div className="text-muted">Loading...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
