import React, { useState } from 'react';
import './AnimatedButton.css';

const AnimatedButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  onClick,
  className = '',
  disabled = false,
  ripple = true
}) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (disabled) return;

    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      const newRipple = {
        x,
        y,
        size,
        id: Date.now()
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button 
      className={`animated-button ${variant} ${size} ${className} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="button-content">{children}</span>
      {ripple && (
        <div className="ripple-container">
          {ripples.map(ripple => (
            <div
              key={ripple.id}
              className="ripple"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
};

export default AnimatedButton;
