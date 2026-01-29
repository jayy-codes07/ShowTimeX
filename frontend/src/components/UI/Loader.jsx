import React from 'react';
import { Film } from 'lucide-react';
import  logo from './../../assets/images/Showtime_logo.png'


const Loader = ({ fullScreen = false, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark flex items-center justify-center z-50">
         <img src={logo} className='h-[100px]' alt="" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
         <img src={logo} className='h-10' alt="" />
      </div>
    </div>
  );
};

export default Loader;