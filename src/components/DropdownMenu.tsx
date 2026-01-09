import { useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Position {
  top: number;
  left: number;
  right?: number;
  placement: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: HTMLElement | null;
  children: ReactNode;
  className?: string;
  minWidth?: number;
}

export function DropdownMenu({
  isOpen,
  onClose,
  trigger,
  children,
  className = '',
  minWidth = 192,
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!isOpen || !trigger) {
      setPosition(null);
      return;
    }

    const calculatePosition = () => {
      const triggerRect = trigger.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight || 200;
      const menuWidth = minWidth;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const spaceRight = viewportWidth - triggerRect.right;
      const spaceLeft = triggerRect.left;

      let top = 0;
      let left = 0;
      let right: number | undefined;
      let placement: Position['placement'] = 'bottom-right';

      const preferBottom = spaceBelow >= menuHeight || spaceBelow > spaceAbove;
      const preferRight = spaceRight >= menuWidth || spaceRight > spaceLeft;

      if (preferBottom) {
        top = triggerRect.bottom + 4;
        if (preferRight) {
          left = triggerRect.right - menuWidth;
          placement = 'bottom-right';
        } else {
          left = triggerRect.left;
          placement = 'bottom-left';
        }
      } else {
        top = triggerRect.top - menuHeight - 4;
        if (preferRight) {
          left = triggerRect.right - menuWidth;
          placement = 'top-right';
        } else {
          left = triggerRect.left;
          placement = 'top-left';
        }
      }

      left = Math.max(8, Math.min(left, viewportWidth - menuWidth - 8));
      top = Math.max(8, Math.min(top, viewportHeight - menuHeight - 8));

      setPosition({ top, left, right, placement });
    };

    calculatePosition();

    const handleScroll = () => calculatePosition();
    const handleResize = () => calculatePosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, trigger, minWidth]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        trigger &&
        !trigger.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, trigger]);

  if (!isOpen || !position) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className={`fixed z-[9999] animate-in fade-in-0 zoom-in-95 duration-100 ${className}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: `${minWidth}px`,
      }}
      role="menu"
      aria-orientation="vertical"
    >
      {children}
    </div>,
    document.body
  );
}
