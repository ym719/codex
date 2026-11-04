import { useEffect, useState } from 'react';
import type { Artwork } from '../types';

export default function ArtworkImage({
  artwork,
  className = '',
  eager = false,
}: {
  artwork: Artwork;
  className?: string;
  eager?: boolean;
}) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const next = URL.createObjectURL(artwork.image);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [artwork.image]);
  return url ? (
    <img
      className={className}
      src={url}
      alt={artwork.title}
      width={artwork.width}
      height={artwork.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  ) : (
    <div
      className="image-placeholder"
      style={{ aspectRatio: `${artwork.width}/${artwork.height}` }}
    />
  );
}
