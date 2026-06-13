"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Instant transition - no delay
    setDisplayChildren(children);
    setIsLoading(false);
  }, [pathname, children]);

  return (
    <div className="page-transition-wrapper">
      <div className="page-transition-content page-transition-loaded">
        {displayChildren}
      </div>
    </div>
  );
}
