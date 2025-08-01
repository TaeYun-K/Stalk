// src/components/ScrollToTop.tsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'auto', // 또는 'smooth'
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop; 