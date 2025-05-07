
import React, { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
}

const QRCode = ({ value, size = 200 }: QRCodeProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // In a real app, this would use an actual QR code generation library
    // For now, we're using a free online API to generate QR codes for demonstration
    if (qrRef.current) {
      const encodedValue = encodeURIComponent(value);
      qrRef.current.style.backgroundImage = `url('https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}')`;
    }
  }, [value, size]);
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className="bg-white p-4 rounded-lg border" 
        style={{ width: size, height: size }}
      >
        <div 
          ref={qrRef}
          className="w-full h-full bg-no-repeat bg-center bg-contain" 
        />
      </div>
    </div>
  );
};

export default QRCode;
