import { Hero } from "@/components/hero-section/Hero";
import { SiteHeader } from "@/components/hero-section/SiteHeader";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <Hero />
    </main>
  );
}
