import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from '../ui/Container';

const CITIES = [
  {
    name: 'Lagos',
    events: '120+ events',
    image: 'https://images.unsplash.com/photo-1578898887930-d3c0ed0ad7c0?w=800&q=80',
  },
  {
    name: 'Abuja',
    events: '80+ events',
    image: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=800&q=80',
  },
  {
    name: 'Port Harcourt',
    events: '45+ events',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  },
  {
    name: 'London',
    events: '200+ events',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  },
  {
    name: 'Dubai',
    events: '150+ events',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  },
];

export default function CityExplorer() {
  return (
    <section className="py-24 lg:py-28 bg-bg">
      <Container>
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Left editorial copy */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-display-lg text-text mb-6 leading-[1.15]">
                Your City.
                <br />
                Your Events.
                <br />
                Your Way.
              </h2>
              <p className="text-body-lg text-muted leading-relaxed mb-8">
                Find incredible events happening near you. From Lagos to London,
                City Event connects you with unforgettable experiences in your
                city and beyond.
              </p>
              <Link to="/events">
                <button className="group inline-flex items-center gap-2 rounded-button bg-primary px-8 py-4 text-base font-semibold
                  text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110
                  active:brightness-90 transition-all duration-200">
                  Explore All Cities
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right city cards */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 gap-4">
              {CITIES.map((city, i) => (
                <motion.div
                  key={city.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative rounded-card overflow-hidden cursor-pointer
                    ${i === 0 ? 'row-span-2' : ''}`}
                >
                  <div className={`relative ${i === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
                    <img
                      src={city.image}
                      alt={`${city.name} skyline`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="flex items-center gap-2 text-text mb-1">
                        <MapPin size={14} />
                        <span className="font-semibold text-base">{city.name}</span>
                      </div>
                      <p className="text-sm text-muted">{city.events}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
