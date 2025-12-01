import React, { useState, useRef, useEffect } from 'react';

// Define the shape of the data points for the chart
export interface ChartDataPoint {
  date: string;
  income: number;
  expense: number;
}

interface ChartProps {
  data: ChartDataPoint[];
}

interface TooltipData {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

const Chart: React.FC<ChartProps> = ({ data }) => {
  const [tooltip, setTooltip] = useState<TooltipData>({ visible: false, content: '', x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 60, left: 70 };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const showTooltip = (content: string, event: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      visible: true,
      content,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expense)), 0);
  const yAxisTicks = 5;
  const yTickValues = Array.from({ length: yAxisTicks + 1 }, (_, i) => (maxValue / yAxisTicks) * i);

  const xScale = (index: number) => (chartWidth / data.length) * index + (chartWidth / data.length) / 2;
  const yScale = (value: number) => chartHeight - (chartHeight * value) / (maxValue > 0 ? maxValue : 1);

  const barWidth = Math.max(1, (chartWidth / data.length) * 0.4 / 2);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 relative" ref={containerRef}>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Visualisasi Tren Keuangan</h2>
      <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          <span>Pemasukan</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
          <span>Pengeluaran</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-500 dark:text-gray-400">Data tidak cukup untuk menampilkan grafik.</p>
        </div>
      ) : (
        <div className="relative">
          {tooltip.visible && (
            <div
              className="absolute bg-gray-800 dark:bg-slate-600 text-white text-xs rounded py-1 px-2 pointer-events-none transform -translate-x-1/2 -translate-y-full z-10"
              style={{ left: tooltip.x, top: tooltip.y - 10 }}
            >
              {tooltip.content.split('\n').map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}
          <svg width="100%" height={height} aria-label="Grafik tren keuangan">
            {/* Y-Axis */}
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {yTickValues.map((tick, i) => (
                <g key={i} transform={`translate(0, ${yScale(tick)})`}>
                  <line x1={-5} x2={chartWidth} className="stroke-gray-200 dark:stroke-slate-700" strokeDasharray="2,2" />
                  <text
                    x={-10}
                    y={5}
                    textAnchor="end"
                    className="text-xs fill-gray-500 dark:fill-gray-400"
                  >
                    {`${Math.round(tick / 1000)}k`}
                  </text>
                </g>
              ))}
              <line x1="0" y1="0" x2="0" y2={chartHeight} className="stroke-gray-300 dark:stroke-slate-600" />
            </g>

            {/* X-Axis */}
            <g transform={`translate(${padding.left}, ${height - padding.bottom})`}>
              <line x1="0" y1="0" x2={chartWidth} y2="0" className="stroke-gray-300 dark:stroke-slate-600" />
              {data.map((d, i) => {
                 const showLabel = data.length <= 15 || i % Math.floor(data.length / 15) === 0;
                 if (!showLabel) return null;
                 return (
                    <text
                        key={i}
                        x={xScale(i)}
                        y={20}
                        textAnchor="middle"
                        className="text-xs fill-gray-500 dark:fill-gray-400"
                    >
                        {formatDate(d.date)}
                    </text>
                 )
              })}
            </g>

            {/* Bars */}
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {data.map((d, i) => (
                <React.Fragment key={d.date}>
                  {/* Income Bar */}
                  <rect
                    x={xScale(i) - barWidth - 1}
                    y={yScale(d.income)}
                    width={barWidth}
                    height={chartHeight - yScale(d.income)}
                    className="fill-green-500 transition-opacity duration-200 hover:opacity-75"
                    onMouseMove={(e) => showTooltip(`${formatDate(d.date)}\nPemasukan: ${formatCurrency(d.income)}`, e)}
                    onMouseLeave={hideTooltip}
                  />
                  {/* Expense Bar */}
                  <rect
                    x={xScale(i) + 1}
                    y={yScale(d.expense)}
                    width={barWidth}
                    height={chartHeight - yScale(d.expense)}
                    className="fill-red-500 transition-opacity duration-200 hover:opacity-75"
                    onMouseMove={(e) => showTooltip(`${formatDate(d.date)}\nPengeluaran: ${formatCurrency(d.expense)}`, e)}
                    onMouseLeave={hideTooltip}
                  />
                </React.Fragment>
              ))}
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};

export default Chart;