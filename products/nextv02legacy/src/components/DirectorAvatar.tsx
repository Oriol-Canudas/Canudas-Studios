interface DirectorAvatarProps {
  size: 'hero' | 'small'
}

export default function DirectorAvatar({ size }: DirectorAvatarProps) {
  if (size === 'hero') {
    return (
      <img
        src="/director.jpg"
        alt=""
        className="w-40 h-40 rounded-full object-cover shadow-md border-4 border-surface mx-auto"
      />
    )
  }
  return (
    <img
      src="/director.jpg"
      alt=""
      className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-surface flex-shrink-0"
    />
  )
}
