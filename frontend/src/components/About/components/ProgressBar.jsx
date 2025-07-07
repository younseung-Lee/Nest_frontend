import React, { useEffect, useState } from 'react';
import './ProgressBar.css';

const ProgressBar = ({ 
  currentStep, 
  totalSteps, 
  animated = true,
  showLabels = false 
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const targetProgress = (currentStep / totalSteps) * 100;
    
    if (animated) {
      let start = 0;
      const duration = 800;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentProgress = start + (targetProgress - start) * easeOutCubic;
        
        setProgress(currentProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      setProgress(targetProgress);
    }
  }, [currentStep, totalSteps, animated]);

  return (
    <div className="progress-bar">
      <div className="progress-track">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
        {Array.from({ length: totalSteps }, (_, index) => (
          <div 
            key={index}
            className={`progress-step ${index + 1 <= currentStep ? 'completed' : ''} ${index + 1 === currentStep ? 'active' : ''}`}
            style={{ left: `${(index / (totalSteps - 1)) * 100}%` }}
          >
            <div className="step-circle">
              {index + 1 <= currentStep ? '✓' : index + 1}
            </div>
            {showLabels && (
              <div className="step-label">
                단계 {index + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
