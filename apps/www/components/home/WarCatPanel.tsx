import {IMAGE_BACKGROUND_HREF} from '@warcats/frontend';
import {ReactNode} from 'react';

interface WarCatPanelProps {
  children: ReactNode;
  width: number;
  height: number;
}

export const WarCatPanel = ({children, width, height}: WarCatPanelProps) => {
  const PAGE_ASPECT_RATIO = height / width;
  const PAGE_WIDTH_VW = '100vw';
  const PAGE_HEIGHT_VW = `${PAGE_ASPECT_RATIO * 100}vw`;
  return (
    <svg
      width={PAGE_WIDTH_VW}
      height={PAGE_HEIGHT_VW}
      viewBox={`0 0 ${width} ${height}`}
    >
      <image href={IMAGE_BACKGROUND_HREF} width={width} height={height}></image>
      {children}
    </svg>
  );
};
