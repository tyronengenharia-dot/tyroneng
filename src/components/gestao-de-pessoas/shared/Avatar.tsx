'use client'

const colors = [
  'from-blue-600 to-blue-400',
  'from-emerald-600 to-emerald-400',
  'from-violet-600 to-violet-400',
  'from-rose-600 to-rose-400',
  'from-amber-600 to-amber-400',
  'from-cyan-600 to-cyan-400',
  'from-orange-600 to-orange-400',
  'from-pink-600 to-pink-400',
]

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  photoUrl?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
}

export function Avatar({ name, size = 'md', photoUrl }: AvatarProps) {
  const sizeClass = sizes[size]
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClass} rounded-xl object-cover flex-shrink-0`}
      />
    )
  }
  return (
    <div
      className={`${sizeClass} rounded-xl bg-gradient-to-br ${getColor(name)} flex items-center justify-center font-semibold text-white flex-shrink-0`}
    >
      {getInitials(name)}
    </div>
  )
}
