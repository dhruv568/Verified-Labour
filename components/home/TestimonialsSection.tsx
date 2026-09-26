'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star, MapPin, CheckCircle2, Quote } from 'lucide-react';

export interface TestimonialItem {
  id?: string;
  slot: number;
  customerName: string;
  profession?: string | null;
  location?: string | null;
  testimonialText?: string | null;
  rating?: number | null;
  isActive: boolean;
  imageUrl: string;
  imageZoom?: number | null;
  imageOffsetX?: number | null;
  imageOffsetY?: number | null;
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/testimonials')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.testimonials)) {
          // Keep only active cards and limit strictly to max 2
          const activeOnly = data.testimonials
            .filter((t: TestimonialItem) => t.isActive)
            .slice(0, 2);
          setTestimonials(activeOnly);
        }
      })
      .catch((err) => {
        console.error('Failed to load testimonials:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && testimonials.length === 0) {
    return null; // Gracefully handle no active testimonials
  }

  return (
    <section
      id="testimonials"
      className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50/80 border-t border-b border-slate-200/80 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#1264D6] rounded-full text-xs font-black border border-blue-200/90 shadow-2xs uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1264D6]" />
            <span>Verified Experiences</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#082B66] tracking-tight">
            What Our Customers Say
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
            Real stories from homeowners and business managers across India who trust Verified Labour for fast, skilled, and safe local professionals.
          </p>
        </div>

        {/* Testimonials Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse shadow-sm"
              >
                <div className="aspect-[3/2] bg-slate-200 rounded-2xl w-full" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          /* Exactly 2 Testimonial Cards Layout */
          <div
            className={`grid grid-cols-1 ${
              testimonials.length === 2 ? 'md:grid-cols-2' : 'md:max-w-xl md:mx-auto'
            } gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch`}
          >
            {testimonials.map((card) => {
              const ratingCount = Math.min(Math.max(card.rating || 5, 1), 5);
              const zoom = card.imageZoom ?? 1;
              const offsetX = card.imageOffsetX ?? 0;
              const offsetY = card.imageOffsetY ?? 0;

              return (
                <div
                  key={card.id || `slot-${card.slot}`}
                  className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1"
                >
                  {/* Testimonial Fixed Aspect-Ratio Image Container (3:2 Aspect Ratio) */}
                  <div className="relative w-full aspect-[3/2] bg-slate-100 overflow-hidden shrink-0 border-b border-slate-100">
                    <Image
                      src={card.imageUrl}
                      alt={`Testimonial from ${card.customerName}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                      className="object-cover transition-transform duration-300 pointer-events-none select-none"
                      style={{
                        transform: `scale(${zoom}) translate(${offsetX}%, ${offsetY}%)`,
                        transformOrigin: 'center center',
                      }}
                      priority={card.slot === 1}
                    />

                    {/* Gradient Overlay at Bottom of Image */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

                    {/* Verified Customer Badge Overlay */}
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-md text-[#082B66] rounded-xl text-[11px] font-black shadow-md border border-white/80">
                        <CheckCircle2 className="w-3.5 h-3.5 fill-[#079447] text-white shrink-0" />
                        <span>Verified Customer</span>
                      </span>
                    </div>

                    {/* Rating Badge Overlay */}
                    <div className="absolute bottom-3 right-3 z-10">
                      <div className="flex items-center gap-0.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-xl text-amber-400 text-xs font-black shadow-md">
                        {Array.from({ length: ratingCount }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Details & Content Box */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    {/* Testimonial Quote Text */}
                    {card.testimonialText && (
                      <div className="relative text-slate-700 text-xs sm:text-sm font-medium leading-relaxed italic">
                        <Quote className="w-5 h-5 text-blue-200 inline-block mr-1.5 -mt-1 rotate-180 shrink-0" />
                        <span>"{card.testimonialText}"</span>
                      </div>
                    )}

                    {/* Customer Info Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-[#082B66] leading-tight">
                          {card.customerName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 font-semibold mt-0.5">
                          {card.profession && <span>{card.profession}</span>}
                          {card.profession && card.location && <span>•</span>}
                          {card.location && (
                            <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              {card.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1264D6] flex items-center justify-center font-black text-sm border border-blue-100 shrink-0">
                        {card.customerName.charAt(0)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
