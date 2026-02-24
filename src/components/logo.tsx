import * as React from 'react';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        {...props}
    >
        <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" fill="hsl(339 71% 23%)" />
        <text
            x="50"
            y="57"
            fontFamily="sans-serif"
            fontSize="38"
            fill="hsl(40 33% 97%)"
            textAnchor="middle"
            fontWeight="bold"
        >
            CB
        </text>
    </svg>
);

export default Logo;
