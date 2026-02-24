"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollAnimations — Adds fade-in-from-bottom GSAP ScrollTrigger
 * animations to every <section> inside the landing page.
 *
 * Drop this component anywhere inside the page; it targets all
 * `section` elements within `main` and staggers the child elements.
 */
export default function ScrollAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray("main section");

      sections.forEach((section, index) => {
        // Set initial state — invisible + pushed down
        gsap.set(section, {
          autoAlpha: 0,
          y: 60,
        });

        gsap.to(section, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.inOut",
          stagger: 0.5,
          scrollTrigger: {
            trigger: section,
            start: "top 75%",    // trigger when top of section hits 85% of viewport
          },
          delay: index === 0 ? 0.2 : 0, // slight delay for hero so it feels intentional
        });
      });
    });

    return () => ctx.revert(); // cleanup all GSAP animations on unmount
  }, []);

  return null; // purely side-effect, renders nothing
}
