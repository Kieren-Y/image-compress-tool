import React from 'react';

const ProgressBar = ({ progress }) => {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="progress-text">{progress}%</div>
    </div>
  );
};

export default ProgressBar; 