
import React from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
}

const QRCode = ({ value, size = 200 }: QRCodeProps) => {
  // This is a mock QR code component for demo purposes
  // In a real app, we'd use a library like react-qr-code
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className="bg-white p-4 rounded-lg border" 
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOCK_QR_CODE')] bg-no-repeat bg-center bg-contain" />
      </div>
    </div>
  );
};

export default QRCode;
