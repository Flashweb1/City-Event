import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import SearchBar from './SearchBar';
import Container from '../ui/Container';

const HERO_IMAGE = '/assets/bg.jfif';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt="Concert crowd enjoying live music"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/70 to-bg/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
      </div>

      <Container className="relative z-10 pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm text-muted mb-8">
              <Sparkles size={16} className="text-accent" />
              Your gateway to unforgettable experiences
            </div>

            <h1 className="text-display-xl text-text leading-[1.05] mb-6">
              DISCOVER EVENTS
              <br />
              THAT{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                MOVE YOU
              </span>
            </h1>

            <p className="text-body-lg text-muted max-w-lg leading-relaxed mb-10">
              The global platform for unforgettable experiences. Book, explore,
              and connect with events in your city and beyond.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/events">
                <button className="group inline-flex items-center gap-2 rounded-button bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:brightness-90 transition-all duration-200">
                  Explore Events
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </Link>
              <Link to="/create-event">
                <button className="rounded-button border border-white/20 px-8 py-4 text-base font-semibold text-text hover:bg-white/5 active:bg-white/10 transition-all duration-200">
                  Create Event
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Search bar below hero text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12"
          >
            <SearchBar />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
