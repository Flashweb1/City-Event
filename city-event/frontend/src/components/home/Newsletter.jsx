import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import Container from '../ui/Container';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Newsletter signup — future integration
    setEmail('');
  };

  return (
    <section className="py-24 lg:py-28 bg-surface">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[32px] bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/10 border border-white/5 p-10 lg:p-16"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16">
            <div className="flex-1">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 text-accent mb-6">
                <Mail size={28} />
              </div>
              <h2 className="text-display-lg text-text mb-3">
                Never Miss Your Next Experience
              </h2>
              <p className="text-body-lg text-muted max-w-md">
                Subscribe to get the best events delivered to your inbox. No
                spam, just amazing experiences.
              </p>
            </div>
            <form
              onSubmit={handleSubmit}
              className="w-full lg:w-auto flex-shrink-0 flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1 min-w-[240px]">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-button bg-bg/50 border border-white/5 text-text placeholder-muted/60 pl-11 pr-4 py-4
                    focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-2 rounded-button bg-primary px-8 py-4 text-base font-semibold
                  text-white hover:brightness-110 active:brightness-90 transition-all duration-200 shadow-lg shadow-primary/25
                  whitespace-nowrap"
              >
                Subscribe
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
