'use client';

import React from 'react';
import Image from 'next/image';

export interface LogoProps {
  className?: string;
  priority?: boolean;
  variant?: 'header' | 'footer' | 'auth' | 'compact' | 'icon';
  alt?: string;
}

export default function Logo({
  className,
  priority = false,
  variant = 'header',
  alt = 'Verified Labour',
}: LogoProps) {
  let sizeClasses = 'h-9 sm:h-11 w-auto';

  if (className) {
    sizeClasses = className;
  } else if (variant === 'header') {
    sizeClasses = 'h-11 sm:h-13 lg:h-[54px] xl:h-[58px] w-auto';
  } else if (variant === 'footer') {
    sizeClasses = 'h-10 sm:h-12 w-auto';
  } else if (variant === 'auth') {
    sizeClasses = 'h-8 sm:h-9 w-auto';
  } else if (variant === 'compact') {
    sizeClasses = 'h-8 w-auto';
  } else if (variant === 'icon') {
    sizeClasses = 'h-8 w-8';
  }

  if (variant === 'icon') {
    return (
      <Image
        src="/logo.jpeg"
        alt={alt}
        width={512}
        height={512}
        className={`${sizeClasses} object-contain`}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src="/logo.jpeg"
      alt={alt}
      width={1516}
      height={577}
      className={`${sizeClasses} object-contain transition-opacity duration-200 select-none`}
      priority={priority}
    />
  );
}
