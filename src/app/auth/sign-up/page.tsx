import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { ViewportSection } from "@/components/viewport-section";

export default function SignUpPage() {
  return (
    <ViewportSection center>
      <Suspense fallback={<div className="text-muted">Loading...</div>}>
        <SignUpForm />
      </Suspense>
    </ViewportSection>
  );
}
