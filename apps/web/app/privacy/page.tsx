import type { Metadata } from "next";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Community Events collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="container-page py-12 max-w-3xl">
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-slate-500 text-sm mb-8">Last updated: October 2026</p>

      <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">1. Information we collect</h2>
          <p>
            When you create an account we collect your name, email address and optionally your
            phone number. When you publish events we store the event details you provide,
            including titles, descriptions, venues and poster images.
          </p>
        </section>

        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">2. How we use your information</h2>
          <p>
            Your information is used to operate the platform: authenticating you, displaying your
            events publicly, moderating submissions, and keeping you informed about the status of
            your events. We do not sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">3. Public content</h2>
          <p>
            Events you submit are reviewed by moderators and, once approved, become publicly
            visible including your display name as the creator. Saved events are visible only to
            you.
          </p>
        </section>

        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">4. Data retention</h2>
          <p>
            We retain account data while your account is active. You may request deletion of your
            account and associated data at any time by contacting the administrators.
          </p>
        </section>

        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">5. Cookies & local storage</h2>
          <p>
            We use browser local storage to keep you signed in and to remember your session. No
            third-party advertising trackers are used on this platform.
          </p>
        </section>

        <section>
          <h2 className="text-slate-900 text-lg font-semibold mb-2">6. Contact</h2>
          <p>For privacy questions, please reach out through the contact details on this site.</p>
        </section>
      </div>
    </div>
  );
}
