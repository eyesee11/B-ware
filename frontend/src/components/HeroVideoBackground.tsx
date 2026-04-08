'use client';

import { useEffect, useRef, useState } from 'react';

// Animation configuration - adjust these values to customize the morph effect
const MORPH_CONFIG = {
  triggerHeight: 1.2, // Viewport heights before morphing starts (1.2 = 1.2 * window.innerHeight)
  minScale: 0.75, // Minimum scale when fully morphed (0.75 = 75% of original size)
  borderRadiusMax: 48, // Maximum border radius in px (creates capsule shape)
  enableYTranslate: true, // Whether to translate video downward as it morphs
  yTranslateMax: 60, // Maximum Y translation in px
  enableOpacityFade: true, // Whether to fade out the video at the end
  opacityFadeStartAt: 0.5, // When to start fading (0 to 1)
  opacityFadeEndAt: 0.85, // When to completely fade (0 to 1)
};

export default function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Ensure video starts playing when component mounts
    if (videoRef.current) {
      const playVideo = async () => {
        try {
          await videoRef.current!.play();
        } catch (error) {
          console.warn('Autoplay blocked by browser or media failed to load', error);
        }
      };

      playVideo();
      const timeout = setTimeout(playVideo, 500);

      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const scrollTop = window.scrollY;
      const triggerHeight = window.innerHeight * MORPH_CONFIG.triggerHeight;

      // Progress from 0 to 1
      // 0 = full-bleed state
      // 1 = fully morphed into capsule
      const progress = Math.min(scrollTop / triggerHeight, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate dynamic styles based on scroll progress
  const getTransformStyle = () => {
    const progress = scrollProgress;

    // Scale: smoothly transition from 1.0 to minScale
    const scale = 1 - (1 - MORPH_CONFIG.minScale) * progress;

    // Border radius: 0 to max (creates the capsule morphing effect)
    const borderRadius = progress * MORPH_CONFIG.borderRadiusMax;

    // Y translation: gradually move down as it morphs
    const translateY = MORPH_CONFIG.enableYTranslate
      ? Math.max(progress - 0.5) * MORPH_CONFIG.yTranslateMax * 2
      : 0;

    // Opacity: fade out smoothly near the end
    let opacity = 1;
    if (MORPH_CONFIG.enableOpacityFade) {
      const fadeStart = MORPH_CONFIG.opacityFadeStartAt;
      const fadeEnd = MORPH_CONFIG.opacityFadeEndAt;

      if (progress >= fadeStart) {
        opacity = Math.max(1 - (progress - fadeStart) / (fadeEnd - fadeStart), 0);
      }
    }

    return {
      transform: `scale(${scale}) translateY(${translateY}px)`,
      borderRadius: `${borderRadius}px`,
      opacity,
      willChange: 'transform, border-radius, opacity',
    };
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden z-0"
      style={{
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes heroMorph {
          0% {
            transform: scale(1);
            border-radius: 0;
          }
          100% {
            transform: scale(${MORPH_CONFIG.minScale});
            border-radius: ${MORPH_CONFIG.borderRadiusMax}px;
          }
        }

        /* Smooth scrolling performance optimization */
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
        style={{
          display: 'block',
          ...getTransformStyle(),
        }}
        onError={() => {
          console.warn('Failed to load hero video background');
        }}
      >
        <source
          src="/video.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
