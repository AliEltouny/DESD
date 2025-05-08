import React, { useRef, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useWindowSize } from '@/hooks/useWindowSize';

interface VirtualizedListProps<T> {
  items: T[];
  height?: number;
  itemSize?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemKey?: (index: number, data: T[]) => string | number;
  className?: string;
  outerClassName?: string;
  itemClassName?: string;
  overscanCount?: number;
  onItemsRendered?: (props: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => void;
}

export function VirtualizedList<T>({
  items,
  height = 500,
  itemSize = 100,
  renderItem,
  itemKey,
  className = '',
  outerClassName = '',
  itemClassName = '',
  overscanCount = 3,
  onItemsRendered,
}: VirtualizedListProps<T>) {
  const listRef = useRef<List>(null);
  const [listWidth, setListWidth] = useState(0);
  const windowSize = useWindowSize();
  const containerRef = useRef<HTMLDivElement>(null);

  // Recalculate width when window size changes
  useEffect(() => {
    if (containerRef.current) {
      setListWidth(containerRef.current.offsetWidth);
    }
  }, [windowSize.width]);

  // On first render, measure the container width
  useEffect(() => {
    if (containerRef.current) {
      setListWidth(containerRef.current.offsetWidth);
    }
  }, []);

  // Default itemKey function uses index
  const defaultItemKey = (index: number) => index;
  
  // Row renderer function
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    return (
      <div 
        style={style} 
        className={`virtualized-list-item ${itemClassName}`}
      >
        {renderItem(items[index], index)}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`virtualized-list-container ${className}`}>
      {listWidth > 0 && (
        <List
          ref={listRef}
          height={height}
          width={listWidth}
          itemCount={items.length}
          itemSize={itemSize}
          overscanCount={overscanCount}
          onItemsRendered={onItemsRendered}
          className={outerClassName}
          itemKey={itemKey || defaultItemKey}
        >
          {Row}
        </List>
      )}
    </div>
  );
}

export default React.memo(VirtualizedList) as typeof VirtualizedList; 