import { useEffect, useRef } from 'react';

export const useScrollToError = (error) => {
  const errorRef = useRef(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [error]);

  return errorRef;
};