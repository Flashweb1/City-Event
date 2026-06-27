import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { eventsAPI } from '../utils/api';
import HeroSection from '../components/home/HeroSection';
import StatsSection from '../components/home/StatsSection';
import CategoryGrid from '../components/home/CategoryGrid';
import FeaturedEvents from '../components/home/FeaturedEvents';
import CityExplorer from '../components/home/CityExplorer';
import Newsletter from '../components/home/Newsletter';

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsAPI
      .getAll()
      .then((events) => setFeaturedEvents(events.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <title>City Event — Discover Events That Move You</title>
        <meta
          name="description"
          content="The global platform for unforgettable experiences. Book, explore, and experience amazing events in your city."
        />
        <meta property="og:title" content="City Event — Discover Events That Move You" />
        <meta
          property="og:description"
          content="The global platform for unforgettable experiences. Book, explore, and experience amazing events."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta
          property="og:image"
          content="/assets/bg.jfif"
        />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <HeroSection />
      <StatsSection />
      <CategoryGrid />
      <FeaturedEvents events={featuredEvents} loading={loading} />
      <CityExplorer />
      <Newsletter />
    </motion.div>
  );
}
