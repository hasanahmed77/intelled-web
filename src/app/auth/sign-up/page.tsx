import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center pt-[72px]">
      <Suspense fallback={<div className="text-muted">Loading...</div>}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
