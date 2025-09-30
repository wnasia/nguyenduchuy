import { useMemo } from "react";

interface CryptoSparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export const CryptoSparkline = ({ data, width = 100, height = 30 }: CryptoSparklineProps) => {
  const path = useMemo(() => {
    if (!data || data.length < 2) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    if (range === 0) return "";

    const points = data.map((price, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((price - min) / range) * height;
      return `${x},${y}`;
    });

    return `M${points.join("L")}`;
  }, [data, width, height]);

  const isPositive = data && data.length > 1 ? data[data.length - 1] > data[0] : true;
  const color = isPositive ? "#16a34a" : "#dc2626";

  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="bg-gray-100 rounded" />;
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};