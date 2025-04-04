import React from 'react';
import clsx from 'clsx';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[96rem]',
  full: 'max-w-none',
};

export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  as: Component = 'div',
  size = 'lg',
}) => {
  return (
    <Component
      className={clsx(
        'mx-auto px-4 sm:px-6 lg:px-8',
        sizes[size],
        className
      )}
    >
      {children}
    </Component>
  );
}; 