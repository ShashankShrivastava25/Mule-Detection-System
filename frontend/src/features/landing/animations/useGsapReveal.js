import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Reveal child elements (`[data-reveal]`) inside the given ref on scroll.
 * Honours prefers-reduced-motion via an opacity-only fallback.
 */
export default function useGsapReveal(rootRef, { stagger = 0.08, y = 32, duration = 0.9 } = {}) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const targets = root.querySelectorAll('[data-reveal]')
    if (!targets.length) return

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        opacity: 0,
        y: reduced ? 0 : y,
        duration: reduced ? 0.001 : duration,
        ease: 'expo.out',
        stagger,
        scrollTrigger: {
          trigger: root,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      })
    }, root)

    return () => ctx.revert()
  }, [rootRef, stagger, y, duration])
}
