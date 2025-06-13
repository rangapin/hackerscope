import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import EmailCapture from "@/components/email-capture";
import FeaturesGrid from "@/components/features-grid";
import FAQ from "@/components/faq";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import { ArrowUpRight } from "lucide-react";

export default async function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Hero />

      <FeaturesGrid />
      <FAQ />
      <Newsletter />
      <Footer />
    </div>
  );
}
