import { requireUser } from "@/lib/auth";
import { PracticeForm } from "@/components/practice-form";

export default async function PracticePage() {
  await requireUser("/practice");

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <span className="tag">Practice</span>
        <h1 className="text-3xl font-semibold">Generate your next worksheet.</h1>
        <p className="text-muted">
          Enter a topic and choose a difficulty. Auto uses your performance history to
          tune the worksheet level.
        </p>
      </div>

      <PracticeForm />
    </div>
  );
}
