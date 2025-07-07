import React from 'react';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import './ScrollReveal.css';

const ScrollReveal = ({ 
  children, 
  animation = 'fadeUp',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  triggerOnce = true,
  className = ''
}) => {
  const [ref, isVisible] = useScrollReveal({ 
    threshold, 
    triggerOnce 
  });

  const animationStyle = {
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}s`
  };

  return (
    <div 
      ref={ref}
      className={`scroll-reveal ${animation} ${isVisible ? 'visible' : ''} ${className}`}
      style={animationStyle}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
