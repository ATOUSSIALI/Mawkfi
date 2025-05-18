import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addHours, addMinutes, isBefore, isAfter, startOfDay, endOfDay, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateTimeSelectorProps {
  onStartTimeChange: (date: Date) => void;
  onEndTimeChange: (date: Date) => void;
  startTime: Date;
  endTime: Date;
  minDuration?: number; // Minimum duration in hours
  maxDuration?: number; // Maximum duration in hours
  className?: string;
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  onStartTimeChange,
  onEndTimeChange,
  startTime,
  endTime,
  minDuration = 1,
  maxDuration = 24,
  className
}) => {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);

  // Generate time options (every 30 minutes)
  const generateTimeOptions = (date: Date, isStartTime: boolean) => {
    const options = [];
    const now = new Date();
    const today = startOfDay(now);
    const isToday = startOfDay(date).getTime() === today.getTime();
    
    // Start from current hour if it's today and start time
    let startHour = isToday && isStartTime ? now.getHours() : 0;
    let startMinute = isToday && isStartTime ? (now.getMinutes() >= 30 ? 30 : 0) : 0;
    
    if (isToday && isStartTime && now.getMinutes() >= 30) {
      startHour = now.getHours() + 1;
      startMinute = 0;
    }
    
    for (let hour = startHour; hour < 24; hour++) {
      for (let minute = hour === startHour ? startMinute : 0; minute < 60; minute += 30) {
        const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = format(new Date().setHours(hour, minute), 'h:mm a');
        options.push({ value: timeValue, label: displayTime });
      }
    }
    
    return options;
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Keep the same time, just change the date
    const newStartTime = new Date(date);
    newStartTime.setHours(startTime.getHours(), startTime.getMinutes());
    
    // Ensure it's not in the past
    const now = new Date();
    if (isBefore(newStartTime, now)) {
      newStartTime.setHours(now.getHours(), now.getMinutes() >= 30 ? 30 : 0);
      if (now.getMinutes() >= 30) {
        newStartTime.setHours(now.getHours() + 1, 0);
      }
    }
    
    onStartTimeChange(newStartTime);
    
    // If end time is now before start time, adjust it
    if (isBefore(endTime, addHours(newStartTime, minDuration))) {
      onEndTimeChange(addHours(newStartTime, minDuration));
    }
    
    setStartDateOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Keep the same time, just change the date
    const newEndTime = new Date(date);
    newEndTime.setHours(endTime.getHours(), endTime.getMinutes());
    
    // Ensure it's after start time + min duration
    const minEndTime = addHours(startTime, minDuration);
    if (isBefore(newEndTime, minEndTime)) {
      newEndTime.setHours(minEndTime.getHours(), minEndTime.getMinutes());
    }
    
    onEndTimeChange(newEndTime);
    setEndDateOpen(false);
  };

  const handleStartTimeSelect = (timeValue: string) => {
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newStartTime = new Date(startTime);
    newStartTime.setHours(hours, minutes);
    
    onStartTimeChange(newStartTime);
    
    // If end time is now before start time + min duration, adjust it
    const minEndTime = addHours(newStartTime, minDuration);
    if (isBefore(endTime, minEndTime)) {
      onEndTimeChange(minEndTime);
    }
    
    setStartTimeOpen(false);
  };

  const handleEndTimeSelect = (timeValue: string) => {
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newEndTime = new Date(endTime);
    newEndTime.setHours(hours, minutes);
    
    // Ensure it's after start time + min duration
    const minEndTime = addHours(startTime, minDuration);
    if (isBefore(newEndTime, minEndTime)) {
      return; // Don't allow invalid selections
    }
    
    // Ensure it's not after start time + max duration
    const maxEndTime = addHours(startTime, maxDuration);
    if (isAfter(newEndTime, maxEndTime)) {
      return; // Don't allow invalid selections
    }
    
    onEndTimeChange(newEndTime);
    setEndTimeOpen(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-medium mb-2">Select Date & Time</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Start</p>
          <div className="flex space-x-2">
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startTime, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startTime}
                  onSelect={handleStartDateSelect}
                  disabled={(date) => isBefore(date, startOfDay(new Date())) || isAfter(date, addDays(new Date(), 30))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover open={startTimeOpen} onOpenChange={setStartTimeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {format(startTime, 'h:mm a')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <div className="p-2 max-h-[300px] overflow-y-auto">
                  {generateTimeOptions(startTime, true).map((option) => (
                    <Button
                      key={option.value}
                      variant="ghost"
                      className="w-full justify-start text-left"
                      onClick={() => handleStartTimeSelect(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-1">End</p>
          <div className="flex space-x-2">
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endTime, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endTime}
                  onSelect={handleEndDateSelect}
                  disabled={(date) => 
                    isBefore(date, startOfDay(startTime)) || 
                    isAfter(date, addDays(startTime, 7))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {format(endTime, 'h:mm a')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <div className="p-2 max-h-[300px] overflow-y-auto">
                  {generateTimeOptions(endTime, false).map((option) => (
                    <Button
                      key={option.value}
                      variant="ghost"
                      className="w-full justify-start text-left"
                      onClick={() => handleEndTimeSelect(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      
      <div className="bg-muted p-2 rounded text-sm">
        <p>Duration: {((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(1)} hours</p>
      </div>
    </div>
  );
};

export default DateTimeSelector;
