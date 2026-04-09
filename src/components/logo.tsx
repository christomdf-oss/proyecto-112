import * as React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="24" height="24" rx="6" fill="hsl(var(--sidebar-primary))" />
    <path
      d="M15 7C11.6667 7 9.5 8.5 9.5 12C9.5 15.5 11.6667 17 15 17"
      stroke="hsl(var(--sidebar-primary-foreground))"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Logo;
