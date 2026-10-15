import Link from 'next/link'

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-muted text-foreground hover:bg-background',
} as const

type Variant = keyof typeof VARIANTS

const BASE =
  'pixel-frame-raised m-[3px] inline-flex items-center justify-center gap-2 px-4 py-2 font-pixel text-lg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ring'

export function PixelButton({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />
}

export function PixelLink({
  variant = 'primary',
  className = '',
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />
}
