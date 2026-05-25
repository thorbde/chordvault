import { useState, useEffect, useCallback, useRef } from 'react';

export function useTwoCol() {
  const getLayoutDefault = () => {
    if (typeof window === 'undefined') return false;
    const isWide = window.innerWidth >= 1024;
    const isLandscapeTablet = window.innerWidth >= 768 &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(orientation: landscape)').matches;
    return isWide || isLandscapeTablet;
  };

  const [twoCol, setTwoCol] = useState(getLayoutDefault);
  const userHasToggled = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      if (!userHasToggled.current) {
        setTwoCol(getLayoutDefault());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTwoCol = useCallback(() => {
    userHasToggled.current = true;
    setTwoCol((prev) => !prev);
  }, []);

  const setTwoColTo = useCallback((val: boolean) => {
    userHasToggled.current = true;
    setTwoCol(val);
  }, []);

  return { twoCol, toggleTwoCol, setTwoCol, setTwoColTo };
}
