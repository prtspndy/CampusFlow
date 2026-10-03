import React from 'react';

const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  status,
  className = '',
}) => {
  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const getDimension = () => {
    switch (size) {
      case 'xs':
        return { dim: 24, fontSize: '0.65rem' };
      case 'sm':
        return { dim: 32, fontSize: '0.75rem' };
      case 'lg':
        return { dim: 48, fontSize: '1.1rem' };
      case 'xl':
        return { dim: 72, fontSize: '1.6rem' };
      case 'md':
      default:
        return { dim: 38, fontSize: '0.875rem' };
    }
  };

  const { dim, fontSize } = getDimension();

  return (
    <div
      className={`position-relative d-inline-flex align-items-center justify-content-center flex-shrink-0 rounded-circle ${className}`}
      style={{
        width: `${dim}px`,
        height: `${dim}px`,
        backgroundColor: '#E0E7FF',
        color: '#3730A3',
        fontWeight: 600,
        fontSize,
        border: '1.5px solid #FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-100 h-100 object-fit-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}

      {status && (
        <span
          className="position-absolute rounded-circle border border-white"
          style={{
            width: `${Math.max(8, dim * 0.25)}px`,
            height: `${Math.max(8, dim * 0.25)}px`,
            bottom: '1px',
            right: '1px',
            backgroundColor: status === 'online' ? 'var(--cf-success)' : '#94A3B8',
          }}
        />
      )}
    </div>
  );
};

export default Avatar;
