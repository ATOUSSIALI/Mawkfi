
import React from 'react';

interface DurationSelectorProps {
  duration: number;
  setDuration: (duration: number) => void;
  options?: number[];
}

const DurationSelector = ({
  duration,
  setDuration,
  options = [1, 2, 3, 4]
}: DurationSelectorProps) => {
  return (
    <div>
      <h3 className="font-medium mb-2">Select Duration</h3>
      <div className="flex space-x-2">
        {options.map((hours) => (
          <button
            key={hours}
            onClick={() => setDuration(hours)}
            className={`flex-1 py-2 px-4 rounded-md border text-center ${
              duration === hours 
                ? 'bg-primary text-white border-primary' 
                : 'border-border bg-card'
            }`}
          >
            {hours}h
          </button>
        ))}
      </div>
    </div>
  );
};

export default DurationSelector;
