"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollAnimations() {
  useEffect(() => {
    let ctx;
    let refreshTimer;

    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        // Target all sections and the footer cleanly
        const elements = gsap.utils.toArray("main section, main footer");

        elements.forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                // Triggers when the top of the element hits 95% of the viewport from the top.
                start: "top 95%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        // Force recalculation of scroll trigger positions once all initial 
        // components (like the ChatContainer) have established their layout heights
        refreshTimer = setTimeout(() => {
          ScrollTrigger.refresh();
        }, 500);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(refreshTimer);
      if (ctx) ctx.revert();
    };
  }, []);

  return null;
}
