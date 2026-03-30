import { requireUser } from "@/lib/auth";
import { AnimatedName } from "@/components/animated-name";
import { PracticeForm } from "@/components/practice-form";
import { fetchProfile } from "@/lib/profile/data";
import { ViewportSection } from "@/components/viewport-section";

export default async function PracticePage() {
  const user = await requireUser("/practice");
  const fallbackName = (user.email ?? "user").split("@")[0];
  const profile = await fetchProfile(user.id);
  const displayName = profile?.full_name?.trim() || fallbackName;

  return (
    <ViewportSection center>
      <div className="w-full space-y-10">
        <div className="space-y-2">
          <span className="tag">Practice</span>
          <h1 className="text-3xl font-semibold">
            What would you like to learn today,{" "}
            <AnimatedName name={displayName} />?
          </h1>
          <p className="text-muted">
            Enter a topic and choose a difficulty. Auto uses your performance history to
            tune the worksheet level.
          </p>
        </div>

        <PracticeForm username={displayName} />
      </div>
    </ViewportSection>
  );
}
