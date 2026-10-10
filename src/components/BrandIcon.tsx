export default function BrandIcon({
  name,
  size = 20,
  className = '',
}: {
  name: string
  size?: number
  className?: string
}) {
  return (
    <img
      className={`brand-logo ${className}`}
      src={`${import.meta.env.BASE_URL}icons/brands/${name}.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      data-brand={name}
      draggable={false}
    />
  )
}
