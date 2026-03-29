import Link from "next/link";
import { ViewportSection } from "@/components/viewport-section";

const tiers = [
  {
    name: "Weekly",
    price: "৳129",
    cadence: "/ week",
    credits: "12 worksheets",
    description: "Fast start for short prep sprints.",
    badge: null,
    highlighted: false,
    features: [
      "AI worksheet generation + grading",
      "Progress tracking",
      "Basic support"
    ],
    cta: "Start weekly"
  },
  {
    name: "Monthly",
    price: "৳349",
    cadence: "/ month",
    credits: "50 worksheets",
    description: "Best balance for consistent students.",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Everything in Weekly",
      "Auto difficulty personalization",
      "Priority generation queue"
    ],
    cta: "Choose monthly"
  },
  {
    name: "Yearly",
    price: "৳3,699",
    cadence: "/ year",
    credits: "600 worksheets / year",
    description: "Lower yearly rate for long-term learners.",
    badge: "Save 12%",
    highlighted: false,
    features: [
      "Everything in Monthly",
      "Annual billing discount",
      "Extended history insights"
    ],
    cta: "Go yearly"
  }
];

export default function PricingPage() {
  return (
    <ViewportSection center>
      <div className="w-full space-y-12">
        <div className="space-y-4 text-center">
          <span className="tag">Pricing</span>
          <h1 className="text-4xl font-semibold">Simple plans, clear value.</h1>
          <p className="mx-auto max-w-2xl text-muted">
            Every plan includes AI worksheet generation, submission grading, and adaptive
            performance tracking. Extra usage: ৳6 per worksheet.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`card relative flex flex-col gap-6 p-6 ${
                tier.highlighted ? "border-accent shadow-[0_0_40px_rgba(255,214,10,0.18)]" : ""
              }`}
            >
              {tier.badge ? (
                <span
                  className={`absolute -top-3 right-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    tier.highlighted
                      ? "bg-accent text-ink-950"
                      : "border border-ink-700 bg-ink-950 text-zinc-300"
                  }`}
                >
                  {tier.badge}
                </span>
              ) : null}
              <div>
                <h2 className="text-2xl font-semibold">{tier.name}</h2>
                <p className="mt-2 text-muted">{tier.description}</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">
                  {tier.price} <span className="text-base font-normal text-muted">{tier.cadence}</span>
                </p>
                <p className="mt-2 text-sm text-zinc-300">{tier.credits}</p>
              </div>
              <ul className="space-y-2 text-sm text-muted">
                {tier.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <Link
                className={`mt-auto button ${tier.highlighted ? "button-primary" : "button-dark-accent"}`}
                href="/practice"
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </ViewportSection>
  );
}
