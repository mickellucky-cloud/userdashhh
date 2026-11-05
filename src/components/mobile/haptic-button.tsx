'use client';

import { type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * mobile/haptic-button.tsx — button with iOS-style spring on tap.
 */
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export function HapticButton({ children, className, variant = 'primary', ...rest }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={cn(
        variant === 'primary' ? 'ios-button' : 'ios-button-secondary',
        className,
      )}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  );
}
