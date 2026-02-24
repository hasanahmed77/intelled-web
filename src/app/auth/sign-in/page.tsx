import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { ViewportSection } from "@/components/viewport-section";

export default function SignInPage() {
  return (
    <ViewportSection center>
      <Suspense fallback={<div className="text-muted">Loading...</div>}>
        <SignInForm />
      </Suspense>
    </ViewportSection>
  );
}
