import React from 'react';

interface RateLimitWarningProps {
  limit?: number;
  remaining?: number;
  resetTime?: Date;
  onDismiss?: () => void;
}

const RateLimitWarning: React.FC<RateLimitWarningProps> = ({
  limit,
  remaining,
  resetTime,
  onDismiss,
}) => {
  // Calculate warning threshold (show warning when less than 25% remaining)
  const showWarning = remaining !== undefined && limit !== undefined && remaining < limit * 0.25;

  if (!showWarning) {
    return null;
  }

  const formatResetTime = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60000);

    if (diffMins < 1) {
      return 'less than a minute';
    } else if (diffMins === 1) {
      return '1 minute';
    } else if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <div className="rate-limit-warning">
      <div className="rate-limit-warning-icon">⚠️</div>
      <div className="rate-limit-warning-content">
        <div className="rate-limit-warning-title">
          Approaching Rate Limit
        </div>
        <div className="rate-limit-warning-message">
          You have {remaining} of {limit} requests remaining.
          {resetTime && ` Limit resets in ${formatResetTime(resetTime)}.`}
        </div>
      </div>
      {onDismiss && (
        <button
          className="rate-limit-warning-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss warning"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default RateLimitWarning;
