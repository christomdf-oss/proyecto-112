import Image from 'next/image';
import * as React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <Image
    src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Logo_COBACAM.svg/1200px-Logo_COBACAM.svg.png"
    width={40}
    height={40}
    alt="Logo de COBACAM"
    className={`rounded-sm bg-white p-1 ${className || ''}`}
  />
);

export default Logo;
