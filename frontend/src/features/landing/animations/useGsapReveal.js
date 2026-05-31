import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function useGsapReveal(
  rootRef,
  { stagger = 0.08, y = 32, duration = 0.9 } = {},
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const targets = root.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    let fallback;
    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: reduced ? 0 : y });

      const anim = gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: reduced ? 0.001 : duration,
        ease: "expo.out",
        stagger,
        paused: true,
      });

      ScrollTrigger.create({
        trigger: root,
        start: "top 85%",
        once: true,
        onEnter: () => anim.play(),
      });

      // Recalculate trigger positions after layout/fonts settle
      ScrollTrigger.refresh();

      // Safety net: never leave content invisible, even if the trigger misfires
      fallback = setTimeout(() => {
        gsap.to(targets, { opacity: 1, y: 0, duration: 0.3 });
      }, 1500);
    }, root);

    return () => {
      clearTimeout(fallback);
      ctx.revert();
    };
  }, [rootRef, stagger, y, duration]);
}
