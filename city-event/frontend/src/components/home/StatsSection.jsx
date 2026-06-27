import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CalendarCheck, Users, MapPin, HeadphonesIcon } from 'lucide-react';
import Container from '../ui/Container';

const STATS = [
  { icon: CalendarCheck, value: '10K+', label: 'Events Hosted', desc: 'Curated experiences across every category' },
  { icon: Users, value: '500K+', label: 'Tickets Sold', desc: 'Happy attendees discovering amazing events' },
  { icon: MapPin, value: '150+', label: 'Cities Worldwide', desc: 'A growing global community of event lovers' },
  { icon: HeadphonesIcon, value: '24/7', label: 'Support', desc: 'We are here whenever you need us' },
];

export default function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-20 lg:py-24 bg-surface">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-card bg-bg/50 border border-white/5 p-6 lg:p-8 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-4">
                  <Icon size={24} />
                </div>
                <div className="text-display-lg text-text mb-1">{stat.value}</div>
                <div className="text-card-title text-text mb-1">{stat.label}</div>
                <p className="text-sm text-muted leading-relaxed">{stat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
