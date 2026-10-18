import { ICON_GRID_SIZE, iconPath, type PixelIcon } from '@/lib/cards/icons'

export function PixelIconGlyph({
  icon,
  className,
  title,
}: {
  icon: PixelIcon
  className?: string
  title?: string
}) {
  return (
    <svg
      viewBox={`0 0 ${ICON_GRID_SIZE} ${ICON_GRID_SIZE}`}
      shapeRendering="crispEdges"
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className ? `block ${className}` : 'block'}
    >
      <path d={iconPath(icon.pixels)} />
    </svg>
  )
}
