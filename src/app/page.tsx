import { MarketingNav } from "@/components/landing/marketing-nav";
import { Hero } from "@/components/landing/hero";
import { ScrollJourney } from "@/components/landing/scroll-journey";
import { Closing } from "@/components/landing/closing";

export default function LandingPage() {
  return (
    <div className="landing-theme relative min-h-dvh">
      {/* Patient-app periwinkle canvas, beneath the journey's scene skies */}
      <div aria-hidden className="fixed inset-0 -z-20 bg-[#d9e5f6]" />
      <MarketingNav />
      <Hero />
      <ScrollJourney />
      <Closing />

      {/* Crawlable copy mirror for SEO / no-JS (the journey renders client-side). */}
      <div className="sr-only">
        <h2>The Nirog care world</h2>
        <p>
          Nirog is a continuous care platform for rural India, pairing a
          voice-first patient app with a responsive doctor workspace.
        </p>
        <h3>Intake</h3>
        <p>ARIA captures symptoms by voice in the patient&rsquo;s language.</p>
        <h3>Triage</h3>
        <p>
          A structured AI handover with red flags reaches the doctor&rsquo;s
          priority queue.
        </p>
        <h3>Consult</h3>
        <p>Audio-first teleconsultation that degrades gracefully and resumes.</p>
        <h3>Care plan</h3>
        <p>
          Notes, prescriptions and follow-up are filed and returned to the
          patient.
        </p>
        <h3>Continuity</h3>
        <p>
          One consent-gated, fully audited longitudinal record — a resolved care
          episode.
        </p>
      </div>
    </div>
  );
}
