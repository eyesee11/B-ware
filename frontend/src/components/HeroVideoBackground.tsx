'use client';

import { useEffect, useRef } from 'react';

export default function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure video starts playing when component mounts
    if (videoRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {
            // Autoplay might be blocked by browser - user can interact to play
            console.warn('Autoplay blocked by browser');
          });
        }
      });
    }

    // Create Intersection Observer for lazy-loading when scrolling back
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoRef.current) {
            // Resume video when it comes into view
            videoRef.current.play().catch(() => {
              console.warn('Could not resume video playback');
            });
          } else if (!entry.isIntersecting && videoRef.current) {
            // Pause video when it leaves view (optimize performance)
            videoRef.current.pause();
          }
        });
      },
      {
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden z-0"
      style={{
        pointerEvents: 'none',
      }}
    >
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
        }}
        onError={() => {
          // Gracefully handle video load failures - video simply won't display
          console.warn('Failed to load hero video background');
        }}
      >
        <source
          src="/video.mp4"
          type="video/mp4"
        />
        {/* Fallback for browsers that don't support video */}
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
