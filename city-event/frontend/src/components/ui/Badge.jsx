export default function Badge({ className = '', variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-primary/15 text-primary',
    cyan: 'bg-accent/15 text-accent',
    purple: 'bg-secondary/15 text-secondary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    white: 'bg-white/10 text-text',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-label font-medium ${
        variants[variant] || variants.default
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
