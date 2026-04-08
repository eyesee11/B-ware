import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface UseHorizontalScrollOptions {
  containerRef: React.RefObject<HTMLElement>;
  sectionsRef: React.RefObject<HTMLElement>;
}

export function useHorizontalScroll({
  containerRef,
  sectionsRef,
}: UseHorizontalScrollOptions) {
  useEffect(() => {
    // Ensure both refs are available
    if (!containerRef.current || !sectionsRef.current) {
      return;
    }

    const container = containerRef.current;
    const sections = sectionsRef.current;

    // Set initial opacity of slides to 0 to prevent flash of unstyled content
    gsap.set(sections.children, { opacity: 0 });

    // Main timeline for the horizontal scroll
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        pin: true,
        scrub: 1,
        end: () => `+=${sections.offsetWidth - window.innerWidth}`,
        invalidateOnRefresh: true,
      },
    });

    // Animate the sections wrapper horizontally
    timeline.to(sections, {
      x: () => -(sections.offsetWidth - window.innerWidth),
      ease: 'none',
    });

    // Animate each tier slide to fade in and slide in from the side
    gsap.utils.toArray<HTMLElement>('.tier-slide').forEach((slide, index) => {
      const fromLeft = index % 2 === 0;
      gsap.fromTo(
        slide,
        { x: fromLeft ? -300 : 300, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: slide,
            containerAnimation: timeline,
            start: 'left 80%', // Start when 80% of the slide is visible
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Set the first slide to be visible initially
    gsap.set(sections.children[0], { opacity: 1, x: 0 });

    return () => {
      // Kill all ScrollTriggers and timelines to prevent memory leaks
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      timeline.kill();
    };
  }, [containerRef, sectionsRef]);
}
