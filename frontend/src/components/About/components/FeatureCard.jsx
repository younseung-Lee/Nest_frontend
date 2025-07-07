import React from 'react';
import './FeatureCard.css';

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  onClick,
  className = '',
  delay = 0 
}) => {
  const cardStyle = {
    animationDelay: `${delay}ms`
  };

  return (
    <div 
      className={`feature-card ${className}`}
      onClick={onClick}
      style={cardStyle}
    >
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
};

export default FeatureCard;
