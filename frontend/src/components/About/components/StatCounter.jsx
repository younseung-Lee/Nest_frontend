import React, { useState, useEffect } from 'react';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import './StatCounter.css';

const StatCounter = ({ 
  endValue, 
  label, 
  suffix = '', 
  prefix = '',
  duration = 2000,
  icon,
  delay = 0 
}) => {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollReveal({ 
    threshold: 0.1, // threshold를 낮춤
    triggerOnce: true 
  });
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // 컴포넌트가 마운트되면 바로 애니메이션 시작 (스크롤 감지 문제 해결)
    const timer = setTimeout(() => {
      if (!hasStarted) {
        setHasStarted(true);
        
        let startTime;
        const startValue = 0;
        
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        
        const updateCount = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          const easedProgress = easeOutCubic(progress);
          const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);
          
          setCount(currentValue);
          
          if (progress < 1) {
            requestAnimationFrame(updateCount);
          } else {
            setCount(endValue);
          }
        };
        
        requestAnimationFrame(updateCount);
      }
    }, delay + 200); // 200ms로 줄임

    return () => clearTimeout(timer);
  }, [endValue, duration, delay, hasStarted]);

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <div ref={ref} className="stat-counter">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">
        {prefix}{formatNumber(count)}{suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatCounter;
