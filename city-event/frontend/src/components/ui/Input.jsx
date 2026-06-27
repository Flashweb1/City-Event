import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { className = '', icon: Icon, ...props },
  ref
) {
  return (
    <div className="relative flex-1">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
      )}
      <input
        ref={ref}
        className={`w-full rounded-input bg-surface-secondary/50 border border-white/5 text-text placeholder-muted/60 
          focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 
          transition-all duration-200 ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 text-body-lg ${className}`}
        {...props}
      />
    </div>
  );
});

export default Input;
