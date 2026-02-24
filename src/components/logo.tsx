import * as React from 'react';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    {...props}
    data-ai-logo-placeholder="true"
  >
    <rect width="100" height="100" rx="8" fill="#E2E8F0" />
    <text
      x="50%"
      y="50%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontFamily="sans-serif"
      fontSize="14"
      fill="#4A5568"
    >
      LOGO
    </text>
  </svg>
);

export default Logo;
