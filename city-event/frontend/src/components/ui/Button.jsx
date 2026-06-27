import { forwardRef } from 'react';

const variants = {
  primary:
    'bg-primary text-white hover:brightness-110 active:brightness-90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30',
  outline:
    'border border-white/20 text-text hover:bg-white/5 active:bg-white/10',
  ghost:
    'text-muted hover:text-text hover:bg-white/5 active:bg-white/10',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-semibold rounded-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
