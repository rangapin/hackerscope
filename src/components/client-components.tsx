"use client";
import { TempoInit } from "@/components/tempo-init";
import { Toaster } from "@/components/ui/toaster";
import { CookieWall } from "@/components/cookie-wall";
import { PageTransition } from "@/components/page-transition";
import BrowserCompatibilityBanner from "@/components/browser-compatibility-banner";

interface ClientComponentsProps {
  children: React.ReactNode;
}

function ClientComponents({ children }: ClientComponentsProps) {
  return (
    <>
      <BrowserCompatibilityBanner />
      <PageTransition>{children}</PageTransition>
      <Toaster />
      <TempoInit />
      <CookieWall />
    </>
  );
}

export default ClientComponents;
