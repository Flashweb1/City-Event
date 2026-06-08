// Backend input validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validateFullName = (name) => {
  if (!name || name.trim().length < 2) {
    return 'Full name must be at least 2 characters';
  }
  return null;
};

export const validateEventTitle = (title) => {
  if (!title || title.trim().length < 3) {
    return 'Event title must be at least 3 characters';
  }
  if (title.length > 200) {
    return 'Event title must be less than 200 characters';
  }
  return null;
};

export const validateEventDescription = (desc) => {
  if (!desc || desc.trim().length < 10) {
    return 'Description must be at least 10 characters';
  }
  return null;
};

export const validateEventLocation = (location) => {
  if (!location || location.trim().length < 2) {
    return 'Location must be at least 2 characters';
  }
  return null;
};

export const validateEventCapacity = (capacity) => {
  const num = parseInt(capacity);
  if (!capacity || isNaN(num) || num < 1) {
    return 'Capacity must be at least 1';
  }
  if (num > 1000000) {
    return 'Capacity cannot exceed 1,000,000';
  }
  return null;
};

export const validateEventPrice = (price) => {
  if (!price && price !== '0' && price !== 0) return null; // Optional
  const num = parseFloat(price);
  if (isNaN(num)) {
    return 'Price must be a valid number';
  }
  if (num < 0) {
    return 'Price cannot be negative';
  }
  if (num > 999999) {
    return 'Price exceeds maximum allowed';
  }
  return null;
};

export const validateEventDateTime = (dateTime) => {
  if (!dateTime) {
    return 'Date and time are required';
  }
  const date = new Date(dateTime);
  if (isNaN(date.getTime())) {
    return 'Invalid date format';
  }
  if (date < new Date()) {
    return 'Event date must be in the future';
  }
  return null;
};

export const validateEventCategory = (category) => {
  const validCategories = ['Technology', 'Music', 'Business', 'Food', 'Sports', 'Arts', 'Other'];
  if (category && !validCategories.includes(category)) {
    return 'Invalid category';
  }
  return null;
};

export const validateImageUrl = (url) => {
  if (!url) return null; // Optional
  try {
    new URL(url);
    return null;
  } catch {
    return 'Invalid image URL';
  }
};

// Sanitize string inputs
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>\"']/g, '') // Remove HTML/SQL injection chars
    .trim();
};

// Validation middleware
export const validateRegistration = (req, res, next) => {
  const errors = {};
  const { email, password, fullName, role } = req.body;

  errors.email = validateEmail(email);
  errors.password = validatePassword(password);
  errors.fullName = validateFullName(fullName);

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([_, v]) => v !== null)
  );

  if (Object.keys(filteredErrors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: filteredErrors });
  }

  next();
};

export const validateEventCreation = (req, res, next) => {
  const errors = {};
  const { title, description, location, dateTime, capacity, price, category, imageUrl } = req.body;

  errors.title = validateEventTitle(title);
  errors.description = validateEventDescription(description);
  errors.location = validateEventLocation(location);
  errors.dateTime = validateEventDateTime(dateTime);
  errors.capacity = validateEventCapacity(capacity);
  errors.price = validateEventPrice(price);
  errors.category = validateEventCategory(category);
  errors.imageUrl = validateImageUrl(imageUrl);

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([_, v]) => v !== null)
  );

  if (Object.keys(filteredErrors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: filteredErrors });
  }

  next();
};
