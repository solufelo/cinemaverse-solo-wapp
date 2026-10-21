import React from 'react';
import { useAuth } from 'wasp/client/auth';
import Header2 from '../components/mvpblocks/header';
import GradientHero from '../components/mvpblocks/gradientHero';
import TMDBCarousel from '../components/mvpblocks/TMDBCarousel';
import Feature1 from '../components/mvpblocks/features';
import AboutUs1 from '../components/mvpblocks/aboutus';
import MeshyCards from '../components/mvpblocks/meshycards';
import Faq1 from '../components/mvpblocks/faq';
import ContactUs from '../components/mvpblocks/contactus';
import Footer4Col from '../components/mvpblocks/footer';
import GuestModeBanner from '../shared/components/GuestModeBanner';

export default function LandingPage() {
  const { data: user } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Cosmic Aurora Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent dark:from-purple-500/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent dark:from-blue-500/30"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,_#8b5cf6_0deg,_#ec4899_120deg,_#06b6d4_240deg,_#8b5cf6_360deg)] opacity-5 dark:opacity-10"></div>
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_0)] bg-[length:20px_20px] opacity-20 dark:opacity-30"></div>
      </div>
      <div className="relative z-10 text-sky-800 dark:text-sky-200">
      <Header2 />
      
      {/* Show guest mode banner for unauthenticated users */}
      {!user && <GuestModeBanner />}
      
      <main className="flex-1">
        <GradientHero />
        
        {/* TMDB Carousel Section */}
        <section className="relative py-16 px-4">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-blue-500/5"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,_#8b5cf6_1px,_transparent_1px),_linear-gradient(-45deg,_#06b6d4_1px,_transparent_1px)] bg-[size:20px_20px] opacity-10"></div>
          <div className="container relative z-10 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Trending Now
              </h2>
              <p className="text-lg text-slate-700 dark:text-sky-200 max-w-2xl mx-auto">
                Discover the most popular movies and TV shows that everyone's talking about
              </p>
            </div>
            <TMDBCarousel />
          </div>
        </section>
        
        <Feature1 />
        <AboutUs1 />
        <MeshyCards />
        <Faq1 />
        <ContactUs />
      </main>
      <Footer4Col />
      </div>
    </div>
  );
}
