import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  ...props
}) => {
  const baseClasses = 'flex items-center justify-center gap-2 rounded-xl transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'site-btn-outline',
    ghost: 'site-btn-ghost',
    danger: 'site-btn-danger',
  };
  
  const sizeClasses = {
    sm: 'py-1.5 px-3 sm:px-4 text-sm',
    md: 'py-2.5 px-4 sm:px-6 text-sm sm:text-base',
    lg: 'py-3 px-5 sm:px-8 text-base sm:text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default Button;
