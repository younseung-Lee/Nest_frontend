import React, { useState, useEffect } from 'react';
import './ChickAnimation.css';

const ChickAnimation = ({ 
  size = 'medium', 
  animation = 'bounce',
  autoPlay = true,
  className = ''
}) => {
  const [isHatching, setIsHatching] = useState(false);
  const [isHatched, setIsHatched] = useState(false);

  useEffect(() => {
    if (autoPlay && animation === 'hatch') {
      const hatchTimer = setTimeout(() => {
        setIsHatching(true);
        setTimeout(() => {
          setIsHatched(true);
        }, 1000);
      }, 2000);

      return () => clearTimeout(hatchTimer);
    }
  }, [autoPlay, animation]);

  const getChickElement = () => {
    if (animation === 'hatch') {
      return (
        <div className="hatch-container">
          <div className={`egg ${isHatching ? 'cracking' : ''} ${isHatched ? 'hatched' : ''}`}>
            🥚
          </div>
          <div className={`chick ${isHatched ? 'emerged' : ''}`}>
            🐥
          </div>
        </div>
      );
    }
    
    return <span className="chick-emoji">🐥</span>;
  };

  return (
    <div className={`chick-animation ${size} ${animation} ${className}`}>
      {getChickElement()}
    </div>
  );
};

export default ChickAnimation;
