import { useState, useEffect } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface UseMouseFollowOptions {
  smoothingFactor?: number;
}

export function useMouseFollow(options: UseMouseFollowOptions = {}) {
  const { smoothingFactor = 0.07 } = options;
  
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [smoothedMousePosition, setSmoothedMousePosition] = useState<MousePosition>({ x: 0, y: 0 });

  // Track raw mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Apply momentum/drag effect to mouse following
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      setSmoothedMousePosition(prev => ({
        x: prev.x + (mousePosition.x - prev.x) * smoothingFactor,
        y: prev.y + (mousePosition.y - prev.y) * smoothingFactor,
      }));
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [mousePosition, smoothingFactor]);

  return { mousePosition, smoothedMousePosition };
}