import { useState, useEffect } from 'react';

export const useScroll = (ref) => {
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    const container = ref.current || window;

    const handleScroll = () => {
      if (!container) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container === window ? {
        scrollTop: window.pageYOffset,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: window.innerHeight
      } : {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight
      };

      const threshold = 100;
      const isBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      setIsNearBottom(isBottom);
    };

    container.addEventListener('scroll', handleScroll);
    // 初始检查一次
    handleScroll();
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [ref]);

  return isNearBottom;
};
