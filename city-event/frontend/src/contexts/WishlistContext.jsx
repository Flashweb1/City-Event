import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cityevent-wishlist');
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading wishlist:', err);
    }
  }, []);

  // Save to localStorage whenever wishlist changes
  useEffect(() => {
    try {
      localStorage.setItem('cityevent-wishlist', JSON.stringify(wishlist));
    } catch (err) {
      console.error('Error saving wishlist:', err);
    }
  }, [wishlist]);

  const toggleWishlist = (eventId) => {
    setWishlist(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  const isInWishlist = (eventId) => {
    return wishlist.includes(eventId);
  };

  const addToWishlist = (eventId) => {
    setWishlist(prev => {
      if (!prev.includes(eventId)) {
        return [...prev, eventId];
      }
      return prev;
    });
  };

  const removeFromWishlist = (eventId) => {
    setWishlist(prev => prev.filter(id => id !== eventId));
  };

  return (
    <WishlistContext.Provider value={{
      wishlist,
      toggleWishlist,
      isInWishlist,
      addToWishlist,
      removeFromWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
