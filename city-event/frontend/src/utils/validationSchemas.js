// Simple validation utility (alternative to zod/yup for lightweight solution)

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

export const validateFullName = (name) => {
  if (!name) return 'Full name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  return null;
};

export const validateEventTitle = (title) => {
  if (!title) return 'Event title is required';
  if (title.trim().length < 3) return 'Title must be at least 3 characters';
  if (title.length > 200) return 'Title must be less than 200 characters';
  return null;
};

export const validateEventDescription = (desc) => {
  if (!desc) return 'Description is required';
  if (desc.trim().length < 10) return 'Description must be at least 10 characters';
  return null;
};

export const validateEventLocation = (location) => {
  if (!location) return 'Location is required';
  if (location.trim().length < 2) return 'Location must be at least 2 characters';
  return null;
};

export const validateDateTime = (dateTime) => {
  if (!dateTime) return 'Date and time are required';
  const date = new Date(dateTime);
  if (isNaN(date.getTime())) return 'Invalid date format';
  if (date < new Date()) return 'Event date must be in the future';
  return null;
};

export const validateCapacity = (capacity) => {
  const num = parseInt(capacity);
  if (!capacity) return 'Capacity is required';
  if (isNaN(num) || num < 1) return 'Capacity must be at least 1';
  if (num > 1000000) return 'Capacity cannot exceed 1,000,000';
  return null;
};

export const validatePrice = (price) => {
  if (!price && price !== '0' && price !== 0) return null; // Optional field
  const num = parseFloat(price);
  if (isNaN(num)) return 'Price must be a valid number';
  if (num < 0) return 'Price cannot be negative';
  if (num > 999999) return 'Price exceeds maximum allowed';
  return null;
};

export const validateImageUrl = (url) => {
  if (!url) return null; // Optional field
  try {
    new URL(url);
    return null;
  } catch {
    return 'Invalid image URL';
  }
};

// Combine multiple validators
export const validateLoginForm = (formData) => {
  const errors = {};
  errors.email = validateEmail(formData.email);
  errors.password = validatePassword(formData.password);
  return Object.fromEntries(
    Object.entries(errors).filter(([_, v]) => v !== null)
  );
};

export const validateRegisterForm = (formData) => {
  const errors = {};
  errors.email = validateEmail(formData.email);
  errors.password = validatePassword(formData.password);
  errors.fullName = validateFullName(formData.fullName);
  return Object.fromEntries(
    Object.entries(errors).filter(([_, v]) => v !== null)
  );
};

export const validateEventForm = (formData) => {
  const errors = {};
  errors.title = validateEventTitle(formData.title);
  errors.description = validateEventDescription(formData.description);
  errors.location = validateEventLocation(formData.location);
  errors.dateTime = validateDateTime(formData.dateTime);
  errors.capacity = validateCapacity(formData.capacity);
  errors.price = validatePrice(formData.price);
  errors.imageUrl = validateImageUrl(formData.imageUrl);
  return Object.fromEntries(
    Object.entries(errors).filter(([_, v]) => v !== null)
  );
};
