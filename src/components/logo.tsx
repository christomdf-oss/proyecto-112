import Image from 'next/image';
import * as React from 'react';

// INSTRUCCIONES:
// 1. Reemplaza la URL de abajo con la URL de tu logo.
// 2. Ve al archivo `next.config.ts` y agrega el dominio de tu logo
//    (por ejemplo, "midominio.com") a la lista de `remotePatterns`.

const Logo = ({ className }: { className?: string }) => (
  <Image
    src="https://placehold.co/100x100/381520/f7f2e8?text=Logo"
    width={40}
    height={40}
    alt="Logo de COBACAM"
    className={className}
  />
);

export default Logo;
