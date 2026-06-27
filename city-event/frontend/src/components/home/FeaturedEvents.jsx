import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Users, Heart, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Container from '../ui/Container';
import Badge from '../ui/Badge';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function FeaturedEvents({ events, loading }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wishlist') || '[]');
    } catch {
      return [];
    }
  });

  const toggleWishlist = (e, eventId) => {
    e.preventDefault();
    e.stopPropagation();
    const next = wishlist.includes(eventId)
      ? wishlist.filter((id) => id !== eventId)
      : [...wishlist, eventId];
    setWishlist(next);
    localStorage.setItem('wishlist', JSON.stringify(next));
  };

  const eventImage = (event) =>
    event.imageUrl ||
    {
      Music: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
      Food: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
      Sports: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=800&q=80',
      Business: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      Technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
      Art: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80',
    }[event.category] ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';

  return (
    <section className="py-24 lg:py-28 bg-surface">
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <div>
            <h2 className="text-display-lg text-text mb-4">Featured Events</h2>
            <p className="text-body-lg text-muted max-w-xl">
              Discover the most popular experiences happening right now.
            </p>
          </div>
          <Link to="/events">
            <button className="group inline-flex items-center gap-2 rounded-button border border-white/20 px-6 py-3 text-sm font-semibold text-text hover:bg-white/5 transition-all duration-200">
              View All Events
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-card bg-bg/50 border border-white/5 overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-white/5" />
                <div className="p-6 space-y-4">
                  <div className="h-4 w-20 bg-white/5 rounded-full" />
                  <div className="h-6 w-3/4 bg-white/5 rounded-lg" />
                  <div className="h-4 w-1/2 bg-white/5 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {events.map((event) => {
              const isWishlisted = wishlist.includes(event.id);
              const date = event.dateTime || event.date_time;
              const formattedDate = date
                ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : null;

              return (
                <motion.div key={event.id} variants={item}>
                  <Link to={`/events/${event.id}`} className="group block rounded-card bg-bg/50 border border-white/5 overflow-hidden
                    hover:border-white/10 hover:shadow-2xl hover:shadow-black/30 transition-all duration-500">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={eventImage(event)}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        {event.category && (
                          <Badge variant="cyan">{event.category}</Badge>
                        )}
                      </div>
                      {formattedDate && (
                        <div className="absolute top-3 right-3 rounded-lg bg-bg/80 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-center">
                          <div className="text-xs font-semibold text-primary uppercase">
                            {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-lg font-bold text-text leading-none">
                            {new Date(date).getDate()}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={(e) => toggleWishlist(e, event.id)}
                        className="absolute bottom-3 right-3 rounded-full bg-bg/60 backdrop-blur-sm border border-white/10 p-2
                          hover:bg-bg/80 transition-all duration-200"
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <Heart
                          size={16}
                          className={isWishlisted ? 'fill-error text-error' : 'text-text'}
                        />
                      </button>
                    </div>
                    <div className="p-6">
                      <h3 className="text-card-title text-text mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted mb-3">
                        <MapPin size={14} />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <Users size={14} />
                          <span>
                            {event.registrationCount || 0}/{event.capacity || 0}
                          </span>
                        </div>
                        <span className="text-card-title text-primary">
                          {event.price && event.price > 0
                            ? `$${parseFloat(event.price).toFixed(2)}`
                            : 'Free'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </Container>
    </section>
  );
}
