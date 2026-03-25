import React from 'react';

const Loader = ({ fullScreen = false }) => {
  const containerStyle = {
    backgroundColor: 'var(--app-bg)',
    backgroundImage: 'var(--app-bg-image)',
  };

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-[9999]"
        style={containerStyle}
      >
        <span
          className="site-brand-logo site-brand-logo-loader animate-pulse"
          role="img"
          aria-label="ShowTimeX"
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={containerStyle}
    >
      <span
        className="site-brand-logo site-brand-logo-loader animate-pulse"
        role="img"
        aria-label="ShowTimeX"
      />
    </div>
  );
};

export default Loader;