import { motion } from 'framer-motion';
import {
  Music,
  UtensilsCrossed,
  Dumbbell,
  Briefcase,
  Monitor,
  Palette,
  Users,
  GraduationCap,
  Moon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from '../ui/Container';

const CATEGORIES = [
  { icon: Music, label: 'Music', color: 'from-pink-500/20 to-rose-500/10', iconColor: 'text-pink-400' },
  { icon: UtensilsCrossed, label: 'Food', color: 'from-orange-500/20 to-amber-500/10', iconColor: 'text-orange-400' },
  { icon: Dumbbell, label: 'Sports', color: 'from-green-500/20 to-emerald-500/10', iconColor: 'text-green-400' },
  { icon: Briefcase, label: 'Business', color: 'from-blue-500/20 to-cyan-500/10', iconColor: 'text-blue-400' },
  { icon: Monitor, label: 'Technology', color: 'from-purple-500/20 to-violet-500/10', iconColor: 'text-purple-400' },
  { icon: Palette, label: 'Art', color: 'from-yellow-500/20 to-amber-500/10', iconColor: 'text-yellow-400' },
  { icon: Users, label: 'Networking', color: 'from-teal-500/20 to-cyan-500/10', iconColor: 'text-teal-400' },
  { icon: GraduationCap, label: 'Education', color: 'from-indigo-500/20 to-blue-500/10', iconColor: 'text-indigo-400' },
  { icon: Moon, label: 'Nightlife', color: 'from-violet-500/20 to-purple-500/10', iconColor: 'text-violet-400' },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function CategoryGrid() {
  return (
    <section className="py-24 lg:py-28 bg-bg">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-display-lg text-text mb-4">Popular Categories</h2>
          <p className="text-body-lg text-muted max-w-xl mx-auto">
            Explore events by category and find something you will love.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.label} to={`/events?category=${cat.label}`}>
                <motion.div
                  variants={item}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className={`rounded-card bg-surface border border-white/5 p-6 lg:p-8 text-center
                    hover:border-white/10 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 cursor-pointer
                    bg-gradient-to-b ${cat.color}`}
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 mb-4 ${cat.iconColor}`}>
                    <Icon size={28} />
                  </div>
                  <div className="text-card-title text-text">{cat.label}</div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
