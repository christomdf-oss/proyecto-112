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
    <path
      d="M4 5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V15C20 16.1046 19.1046 17 18 17H13.5L12 20L10.5 17H6C4.89543 17 4 16.1046 4 15V5Z"
      fill="hsl(var(--destructive))"
    />
    <path
      d="M15.5 8C13.5556 8 12 9.5 12 12.3333C12 15.1667 13.5556 16.6667 15.5 16.6667"
      stroke="hsl(var(--primary-foreground))"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Logo;
