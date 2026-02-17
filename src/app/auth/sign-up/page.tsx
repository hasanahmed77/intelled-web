import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="text-muted">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
