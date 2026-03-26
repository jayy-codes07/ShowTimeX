import React from 'react';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-primary ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`input-field ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : 'focus:outline-none focus:ring-2 focus:ring-primary'}`}
          {...props}
        />
      </div>
      
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-500" role="alert">{error}</p>
      )}
    </div>
  );
};

export default Input;