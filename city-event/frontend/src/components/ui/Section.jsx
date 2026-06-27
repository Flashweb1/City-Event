import { forwardRef } from 'react';

const Section = forwardRef(function Section(
  { className = '', children, ...props },
  ref
) {
  return (
    <section
      ref={ref}
      className={`py-24 lg:py-28 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
});

export default Section;
