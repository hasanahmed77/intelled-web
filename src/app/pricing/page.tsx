import Link from "next/link";
import { ViewportSection } from "@/components/viewport-section";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    description: "Explore personalized worksheets for a single learner.",
    features: [
      "2 questions per worksheet",
      "Basic performance tracking",
      "Static worksheet library"
    ]
  },
  {
    name: "Studio",
    price: "$12 / month",
    description: "For tutors and small cohorts.",
    features: [
      "Unlimited worksheet requests",
      "Auto difficulty tuning",
      "Progress reports"
    ]
  },
  {
    name: "Academy",
    price: "$49 / month",
    description: "Teams and schools running multiple classes.",
    features: [
      "Team workspaces",
      "Advanced analytics",
      "Priority AI generation"
    ]
  }
];

export default function PricingPage() {
  return (
    <ViewportSection center>
      <div className="w-full space-y-12">
        <div className="space-y-4">
          <span className="tag">Pricing</span>
          <h1 className="text-4xl font-semibold">Simple, transparent plans.</h1>
          <p className="text-muted">
            Start free and scale as your classroom grows. All plans include the core
            worksheet engine.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.name} className="card flex flex-col gap-6 p-6">
              <div>
                <h2 className="text-2xl font-semibold">{tier.name}</h2>
                <p className="mt-2 text-muted">{tier.description}</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{tier.price}</p>
              </div>
              <ul className="space-y-2 text-sm text-muted">
                {tier.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <Link className="button button-primary mt-auto" href="/practice">
                Get started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </ViewportSection>
  );
}
