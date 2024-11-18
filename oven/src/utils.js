/* NOTE: this JavaScript exists to play nice with existing shadcn-svelte conventions and where it expects this file to exist. */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple class values and tailwind classes together.
 * Uses clsx for conditional classes and twMerge to properly merge tailwind classes.
 * @example ```ts
cn('px-4 py-2', condition && 'bg-blue-500', 'hover:bg-blue-600')
cn({ 'bg-blue-500': isActive }, 'px-4 py-2')
```
 * @param {any[]} inputs
 */
export function cn(...inputs) {
	return twMerge(clsx(inputs));
}
