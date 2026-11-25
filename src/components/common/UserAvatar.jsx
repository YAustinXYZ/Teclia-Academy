import { useEffect, useState } from 'react';
import { resolveAvatar } from '../../utils/avatar.js';

const sizeMap = {
  sm: 38,
  md: 42,
  lg: 58,
  xl: 128,
};

export const UserAvatar = ({
  name = '',
  avatarUrl = '',
  size = 'md',
  className = '',
  imageClassName = '',
  placeholderClassName = '',
}) => {
  const src = resolveAvatar(avatarUrl);
  const [broken, setBroken] = useState(false);
  const dimension = sizeMap[size] || sizeMap.md;
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const alt = name ? `Foto de perfil de ${name}` : 'Avatar de usuario';

  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={alt}
        className={imageClassName || className}
        loading="lazy"
        decoding="async"
        width={dimension}
        height={dimension}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span
      className={placeholderClassName || className}
      role="img"
      aria-label={alt}
    >
      {initial}
    </span>
  );
};
