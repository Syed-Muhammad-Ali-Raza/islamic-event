import type { Metadata } from "next";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules and responsibilities that apply when using Community Events.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="container-page py-12 max-w-3xl">
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Terms of Service", path: "/terms" },
        ])}
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
      <p className="text-slate-500 text-sm mb-8">Last updated: October 2026</p>

      <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">1. Acceptance of terms</h2>
          <p>
            By creating an account or using Community Events you agree to these terms. If you do
            not agree, please do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">2. Your content</h2>
          <p>
            You are responsible for the events you publish. All event information must be accurate,
            non-fraudulent and non-offensive. Do not publish events you do not have the right to
            share.
          </p>
        </section>

        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">3. Moderation</h2>
          <p>
            Every submitted event is reviewed before it appears publicly. We may reject, edit or
            remove any event that violates these guidelines, and may suspend accounts that
            repeatedly break the rules.
          </p>
        </section>

        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">4. Prohibited conduct</h2>
          <p>
            Spam, scams, duplicate listings, hate speech, harassment and illegal content are not
            tolerated. Reporting tools are available on every event page.
          </p>
        </section>

        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">5. Limitation of liability</h2>
          <p>
            The platform is provided &ldquo;as is&rdquo;. We are not responsible for the accuracy
            of community-submitted events or for what happens at offline gatherings. Always verify
            event details with the organizer.
          </p>
        </section>

        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">6. Changes to these terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the platform after
            changes constitutes acceptance of the revised terms.
          </p>
        </section>
      </div>
    </div>
  );
}
