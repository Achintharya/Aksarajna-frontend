import React from 'react';
import './ProgressSteps.css';

function ProgressSteps({ currentStep, percentage }) {
  const steps = ['Searching', 'Crawling', 'Extracting', 'Summarizing', 'Complete'];
  
  return (
    <div className="progress-steps">
      <div className="steps-container">
        {steps.map((step, index) => {
          const isActive = step === currentStep;
          const isCompleted = steps.indexOf(currentStep) > index;
          
          return (
            <div 
              key={step} 
              className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <div className="step-icon">
                {isCompleted ? '✓' : index + 1}
              </div>
              <div className="step-label">{step}</div>
            </div>
          );
        })}
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="progress-percentage">{percentage}%</div>
      </div>
      
      {currentStep && currentStep !== 'Complete' && (
        <div className="progress-message">
          <span className="spinner-small"></span>
          {currentStep}...
        </div>
      )}
    </div>
  );
}

export default ProgressSteps;
