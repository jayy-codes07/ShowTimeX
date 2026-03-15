import React from 'react';
import logo from './../../assets/images/Showtime_logo.png';

const Loader = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <img
          src={logo}
          className="h-[120px] animate-pulse"
          alt="ShowTimeX"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
      <img
        src={logo}
        className="h-[120px] animate-pulse"
        alt="ShowTimeX"
      />
    </div>
  );
};

export default Loader;