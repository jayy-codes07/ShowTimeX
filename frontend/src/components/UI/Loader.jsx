import React from 'react';
import { Film } from 'lucide-react';
import  logo from './../../assets/images/Showtime_logo.png'


const Loader = ({ fullScreen = false, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark flex items-center justify-center z-50">
         <img src={logo} className='h-12' alt="" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Film className="w-12 h-12 text-primary mx-auto mb-3 animate-pulse" />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
};

export default Loader;