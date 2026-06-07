import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHero from "@/components/landing/LandingHero";

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-(--surface-low) text-primary">
      <LandingHero />
      <LandingFeatures />
      <LandingFooter />
    </main>
  );
}
