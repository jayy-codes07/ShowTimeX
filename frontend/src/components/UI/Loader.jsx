import React from 'react';

const Loader = ({ fullScreen = false, message = '', size = 'md' }) => {
  const containerStyle = {
    backgroundColor: 'var(--app-bg)',
    backgroundImage: 'var(--app-bg-image)',
  };

  const sizeClass =
    size === 'small'
      ? 'scale-75'
      : size === 'large'
      ? 'scale-110'
      : 'scale-100';

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-[9999]"
        style={containerStyle}
      >
        <span
          className={`site-brand-logo site-brand-logo-loader animate-pulse ${sizeClass}`}
          role="img"
          aria-label="ShowTimeX"
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center py-10 gap-3">
      <span
        className={`site-brand-logo site-brand-logo-loader animate-pulse ${sizeClass}`}
        role="img"
        aria-label="ShowTimeX"
      />
      {message ? <p className="text-sm text-gray-400">{message}</p> : null}
    </div>
  );
};

export default Loader;