import React from 'react';

interface IconProps {
  name: string;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, className = '' }) => {
  const getIconContent = (iconName: string): string => {
    switch (iconName) {
      case 'fox':
        return '🦊';
      case 'chick':
        return '🐤';
      case 'panda':
        return '🐼';
      case 'shiba':
        return '🐕';
      case 'rabbit':
        return '🐰';
      default:
        return '👤';
    }
  };

  return (
    <span className={className}>
      {getIconContent(name)}
    </span>
  );
};

export default Icon; 