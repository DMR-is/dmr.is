export type ImageProps = {
  src: string
  alt?: string
  className?: string
}

export const Image = ({ src, alt = '', className }: ImageProps) => {
  return <img src={src} alt={alt} className={className} />
}
