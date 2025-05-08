
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, startOfDay, subDays, eachDayOfInterval } from 'date-fns';

// Type definitions for the component props
export interface BookingHistoryItem {
  date: string;
  bookings: number;
}

export interface SpotBookingHistoryProps {
  spotId?: string;
  spotLabel?: string;
  bookingHistory?: BookingHistoryItem[];
  isLoading: boolean;
}

const SpotBookingHistory: React.FC<SpotBookingHistoryProps> = ({
  spotId,
  spotLabel,
  bookingHistory = [],
  isLoading
}) => {
  if (!spotId || bookingHistory.length === 0) {
    return null;
  }

  // Configuration for the chart
  const chartConfig = {
    bookings: {
      label: 'Bookings',
      color: '#0ea5e9',
    },
  };

  // Format the data for the chart
  const today = startOfDay(new Date());
  const pastSevenDays = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  }).map(day => format(day, 'yyyy-MM-dd'));

  const chartData = pastSevenDays.map(day => {
    const historyItem = bookingHistory.find(h => h.date === day);
    return {
      date: day,
      bookings: historyItem ? historyItem.bookings : 0,
      day: format(parseISO(day), 'EEE'),
    };
  });

  return (
    <Accordion type="single" collapsible className="mt-4">
      <AccordionItem value="spot-history">
        <AccordionTrigger className="text-sm py-2">
          <span>Booking History for Spot {spotLabel}</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="bg-white rounded-md p-2 text-xs">
            <ChartContainer
              config={chartConfig}
              className="aspect-[4/3] w-full"
            >
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 15, right: 5, left: -20, bottom: 5 }}>
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={20}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => format(parseISO(chartData[value as number]?.date || today.toISOString().split('T')[0]), 'MMM dd, yyyy')}
                      />
                    }
                  />
                  <Bar 
                    dataKey="bookings" 
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.bookings > 0 ? '#0ea5e9' : '#e2e8f0'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Date</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((item) => (
                  <TableRow key={item.date}>
                    <TableCell>{format(parseISO(item.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right font-medium">
                      {item.bookings}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default SpotBookingHistory;
