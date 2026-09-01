"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    id: 1,
    title: "Summer Collection 2026",
    subtitle: "Discover the latest trends with up to 50% off on selected items",
    buttonText: "Shop Now",
    buttonLink: "/products",
    gradient: "from-violet-600/90 via-purple-600/80 to-indigo-600/90",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=500&fit=crop",
  },
  {
    id: 2,
    title: "Tech Essentials",
    subtitle: "Upgrade your workspace with premium gadgets and accessories",
    buttonText: "Explore",
    buttonLink: "/products?category=electronics",
    gradient: "from-cyan-600/90 via-blue-600/80 to-indigo-600/90",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&h=500&fit=crop",
  },
  {
    id: 3,
    title: "Home & Living",
    subtitle: "Transform your space with our curated collection of home decor",
    buttonText: "Discover",
    buttonLink: "/products?category=home",
    gradient: "from-orange-600/90 via-amber-600/80 to-yellow-600/90",
    image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1200&h=500&fit=crop",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
      } else if (e.key === "ArrowRight") {
        setCurrent((prev) => (prev + 1) % slides.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  const next = () => setCurrent((prev) => (prev + 1) % slides.length);

  const slide = slides[current];

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[300px] md:h-[400px] lg:h-[450px]">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${slide.image})` }}
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />

        <div className="relative flex h-full items-center">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="max-w-xl space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                {slide.title}
              </h1>
              <p className="text-base text-white/80 md:text-lg">
                {slide.subtitle}
              </p>
              <Button asChild variant="accent" size="lg" className="mt-4">
                <Link href={slide.buttonLink}>{slide.buttonText}</Link>
              </Button>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Slide navigation">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            role="tab"
            aria-label={`Go to slide ${i + 1}`}
            aria-selected={i === current}
            className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
              i === current ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
