import React, { useState } from 'react';
import type { StockoutPrediction, ForecastDataPoint } from '../../intelligence/types/prediction';

interface ForecastChartProps {
  prediction: StockoutPrediction;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ prediction }) => {
  const { bloodGroup, forecastCurve, currentStock, estimatedStockoutHours } = prediction;
  const [hoveredPoint, setHoveredPoint] = useState<ForecastDataPoint | null>(null);

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 320;
  const padding = { top: 35, right: 35, bottom: 50, left: 55 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Domain & range
  const minHour = -6;
  const maxHour = 24;
  const hourSpan = maxHour - minHour; // 30 hours

  // Helper to extract inventory value from a data point
  const getPointValue = (pt: ForecastDataPoint): number => {
    if (pt.isForecast) {
      return pt.forecastStock ?? 0;
    }
    return pt.actualStock ?? currentStock;
  };

  // Calculate maximum inventory value for Y axis scale
  const rawMax = Math.max(
    ...forecastCurve.map((p: ForecastDataPoint) => p.upperBound ?? getPointValue(p)),
    currentStock,
    6
  );
  // Add a 15% headroom
  const maxY = Math.ceil(rawMax * 1.15);

  // Coordinate mappers
  const getX = (hourOffset: number) => {
    return padding.left + ((hourOffset - minHour) / hourSpan) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(val, maxY));
    return padding.top + chartHeight - (clamped / maxY) * chartHeight;
  };

  // Split points into actuals (<= 0) and forecast (>= 0)
  const actualPoints = forecastCurve.filter((p: ForecastDataPoint) => p.hourOffset <= 0);
  const forecastSeries = forecastCurve.filter((p: ForecastDataPoint) => p.hourOffset >= 0);

  // Path generators
  const actualPath = actualPoints.reduce((acc: string, pt: ForecastDataPoint, i: number) => {
    const x = getX(pt.hourOffset);
    const y = getY(getPointValue(pt));
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const forecastPath = forecastSeries.reduce((acc: string, pt: ForecastDataPoint, i: number) => {
    const x = getX(pt.hourOffset);
    const y = getY(getPointValue(pt));
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Uncertainty corridor polygon (upper bound path forward, lower bound path backward)
  const uncertaintyPolygon = (() => {
    if (forecastSeries.length < 2) return '';
    const upperCoords = forecastSeries.map((p: ForecastDataPoint) => ({
      x: getX(p.hourOffset),
      y: getY(p.upperBound ?? getPointValue(p)),
    }));
    const lowerCoords = [...forecastSeries].reverse().map((p: ForecastDataPoint) => ({
      x: getX(p.hourOffset),
      y: getY(p.lowerBound ?? getPointValue(p)),
    }));

    const path1 = upperCoords.map((c: { x: number; y: number }, i: number) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(' ');
    const path2 = lowerCoords.map((c: { x: number; y: number }) => `L ${c.x} ${c.y}`).join(' ');
    return `${path1} ${path2} Z`;
  })();

  // Transition divider X coordinate (hourOffset = 0)
  const nowX = getX(0);

  // Y-axis grid ticks (e.g., 4 or 5 intervals)
  const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), maxY];

  // X-axis display labels (every 3-6 hours)
  const xTickHours = [-6, -3, 0, 3, 6, 9, 12, 18, 24];

  // Accessible summary sentence (Section 58)
  const accessibleSummary =
    estimatedStockoutHours !== undefined && estimatedStockoutHours <= 24
      ? `${bloodGroup} inventory is forecast to decline from ${currentStock} units to approximately 0 units within ${estimatedStockoutHours.toFixed(
          1
        )} hours under the current demand pattern.`
      : `${bloodGroup} inventory currently has ${currentStock} units with sufficient coverage exceeding 24 hours under normal demand velocity.`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h4 className="font-poppins font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
            <span>{bloodGroup} Inventory Trajectory</span>
            <span className="text-xs font-normal text-slate-500 font-mono">
              (Past 6h Actuals vs Next 24h Depletion Forecast)
            </span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict separation: solid line depicts verified physical usage; dashed line illustrates predictive demand trajectory.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-slate-800 rounded-full" />
            <span className="w-2 h-2 rounded-full bg-slate-800 -ml-2" />
            <span>Actual (Past 6h)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-600" />
            <span className="w-2 h-2 rounded-full bg-rose-600 -ml-2" />
            <span>Forecast (Next 24h)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 bg-rose-100/80 border border-rose-300 rounded-xs" />
            <span>Likely Range</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[620px] overflow-visible text-xs font-mono"
          role="img"
          aria-label={`Forecast chart for blood group ${bloodGroup}. ${accessibleSummary}`}
        >
          {/* Background gridlines for Y axis */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={`ytick-${val}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke={val === 0 ? '#cbd5e1' : '#f1f5f9'}
                  strokeWidth={val === 0 ? 1.5 : 1}
                  strokeDasharray={val === 0 ? undefined : '3 3'}
                />
                <text
                  x={padding.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                >
                  {val} U
                </text>
              </g>
            );
          })}

          {/* Uncertainty Corridor shaded area (Forecast zone only) */}
          {uncertaintyPolygon && (
            <path
              d={uncertaintyPolygon}
              fill="#f43f5e"
              fillOpacity="0.09"
              stroke="#fb7185"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
          )}

          {/* Transition vertical divider: CURRENT MOMENT (T = 0) */}
          <line
            x1={nowX}
            y1={padding.top}
            x2={nowX}
            y2={svgHeight - padding.bottom}
            stroke="#C1272D"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <g transform={`translate(${nowX}, ${padding.top - 10})`}>
            <rect
              x="-35"
              y="-12"
              width="70"
              height="18"
              rx="4"
              fill="#C1272D"
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10"
              fontWeight="600"
              fontFamily="sans-serif"
            >
              NOW (T=0)
            </text>
          </g>

          {/* Zero Stock Alert Line */}
          <line
            x1={padding.left}
            y1={getY(0)}
            x2={svgWidth - padding.right}
            y2={getY(0)}
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.6"
          />

          {/* Actuals Path (Solid Slate/Black) */}
          <path
            d={actualPath}
            fill="none"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Forecast Path (Dashed Rose/Red) */}
          <path
            d={forecastPath}
            fill="none"
            stroke="#e11d48"
            strokeWidth="2.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points Markers */}
          {forecastCurve.map((pt: ForecastDataPoint, idx: number) => {
            const cx = getX(pt.hourOffset);
            const cy = getY(getPointValue(pt));
            const isActual = !pt.isForecast;
            const isNow = pt.hourOffset === 0;

            return (
              <g
                key={`point-${idx}`}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Hit target */}
                <circle cx={cx} cy={cy} r="14" fill="transparent" />

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isNow ? 5 : 4}
                  fill={isActual ? '#0f172a' : '#e11d48'}
                  stroke="#ffffff"
                  strokeWidth={isNow ? 2.5 : 1.8}
                />
              </g>
            );
          })}

          {/* X Axis Ticks and Labels */}
          {xTickHours.map((h) => {
            const x = getX(h);
            const label =
              h < 0
                ? `${h}h`
                : h === 0
                ? 'Current'
                : `+${h}h`;

            return (
              <g key={`xtick-${h}`} transform={`translate(${x}, ${svgHeight - padding.bottom + 16})`}>
                <line x1="0" y1="-16" x2="0" y2="-11" stroke="#cbd5e1" strokeWidth="1" />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  fill={h === 0 ? '#C1272D' : '#64748b'}
                  fontWeight={h === 0 ? '700' : '500'}
                  fontSize="11"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Section labels: PAST ACTUALS vs FUTURE FORECAST */}
          <text
            x={padding.left + (nowX - padding.left) / 2}
            y={svgHeight - 12}
            textAnchor="middle"
            fill="#64748b"
            fontSize="10"
            fontWeight="600"
            letterSpacing="0.05em"
          >
            ← VERIFIED ACTUAL USAGE
          </text>
          <text
            x={nowX + (svgWidth - padding.right - nowX) / 2}
            y={svgHeight - 12}
            textAnchor="middle"
            fill="#e11d48"
            fontSize="10"
            fontWeight="600"
            letterSpacing="0.05em"
          >
            PROJECTED DEPLETION TRAJECTORY →
          </text>
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-4 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-md border border-slate-700 pointer-events-none transition-all"
            style={{ minWidth: '150px' }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1">
              <span className="font-semibold text-slate-200">
                {hoveredPoint.timeFormatted} ({hoveredPoint.hourOffset === 0 ? 'Current' : hoveredPoint.hourOffset > 0 ? `+${hoveredPoint.hourOffset}h` : `${hoveredPoint.hourOffset}h`})
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                  !hoveredPoint.isForecast
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-rose-900/80 text-rose-300'
                }`}
              >
                {hoveredPoint.isForecast ? 'Forecast' : 'Actual'}
              </span>
            </div>
            <div className="font-mono text-sm font-bold text-white">
              {getPointValue(hoveredPoint).toFixed(1)} units
            </div>
            {hoveredPoint.lowerBound !== undefined && hoveredPoint.upperBound !== undefined && (
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Likely: {hoveredPoint.lowerBound.toFixed(1)}–{hoveredPoint.upperBound.toFixed(1)} U
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accessible Summary / Judge Test Callout (Section 58 & 71) */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-start gap-2.5">
        <span className="font-semibold text-slate-900 shrink-0 font-poppins">
          Summary:
        </span>
        <p className="leading-relaxed">
          {accessibleSummary}
        </p>
      </div>
    </div>
  );
};
