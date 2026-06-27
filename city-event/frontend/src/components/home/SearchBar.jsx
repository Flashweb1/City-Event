import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Grid3X3, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const TRENDING = [
  'Music', 'Business', 'Food', 'Sports', 'Festival', 'Conference',
];

export default function SearchBar() {
  const [query, setQuery] = useState('');

  return (
    <div>
      <div className="rounded-card bg-surface/80 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/30 p-2">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full h-14 lg:h-12 rounded-button bg-transparent pl-11 pr-4 text-text placeholder-muted/60
                focus:outline-none border-0 text-base"
            />
          </div>

          <div className="h-px lg:h-8 w-full lg:w-px bg-white/5" />

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 px-0 lg:px-1">
            <div className="flex items-center gap-2 px-3 h-14 lg:h-12 rounded-button hover:bg-white/5 transition-colors cursor-pointer">
              <MapPin size={16} className="text-muted shrink-0" />
              <span className="text-muted text-sm">Location</span>
            </div>
            <div className="flex items-center gap-2 px-3 h-14 lg:h-12 rounded-button hover:bg-white/5 transition-colors cursor-pointer">
              <Grid3X3 size={16} className="text-muted shrink-0" />
              <span className="text-muted text-sm">Category</span>
            </div>
            <div className="flex items-center gap-2 px-3 h-14 lg:h-12 rounded-button hover:bg-white/5 transition-colors cursor-pointer">
              <Calendar size={16} className="text-muted shrink-0" />
              <span className="text-muted text-sm">Any date</span>
            </div>
          </div>

          <Link to={`/events${query ? `?search=${encodeURIComponent(query)}` : ''}`}>
            <button className="w-full lg:w-auto h-14 lg:h-12 px-8 rounded-button bg-primary text-white font-semibold text-base
              hover:brightness-110 active:brightness-90 transition-all duration-200 flex items-center justify-center gap-2
              shadow-lg shadow-primary/25">
              Search
              <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="text-label text-muted/60 mr-1">Trending:</span>
        {TRENDING.map((tag) => (
          <Link key={tag} to={`/events?search=${tag}`}>
            <motion.span
              whileHover={{ y: -1 }}
              className="inline-block rounded-full bg-white/5 border border-white/5 px-3.5 py-1.5 text-sm text-muted
                hover:bg-white/10 hover:text-text hover:border-white/10 cursor-pointer transition-all duration-200"
            >
              {tag}
            </motion.span>
          </Link>
        ))}
      </div>
    </div>
  );
}
