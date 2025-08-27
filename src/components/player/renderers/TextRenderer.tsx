'use client';

interface TextRendererProps {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
}

export function TextRenderer({ 
  text, 
  backgroundColor = '#000000',
  textColor = '#ffffff',
  fontSize = '3rem'
}: TextRendererProps) {
  return (
    <div 
      className="w-full h-full flex items-center justify-center p-8"
      style={{ backgroundColor }}
    >
      <div 
        className="text-center max-w-4xl"
        style={{ 
          color: textColor,
          fontSize,
          lineHeight: 1.5
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default TextRenderer;