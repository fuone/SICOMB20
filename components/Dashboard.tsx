import React, { useEffect, useState, useMemo, ReactElement, useRef } from 'react';
import { FuelRecord, VehicleOption } from '../types';
import { fetchRecords, fetchFormOptions } from '../services/sheetsService';
import { 
  Loader2, TrendingUp, DollarSign, Droplet, Gauge, AlertCircle, 
  Milestone, CalendarRange,
  PieChart as PieChartIcon, Zap, Banknote, CalendarClock, Fuel, CreditCard, Smartphone,
  ChevronDown, ChevronUp, Settings, ArrowUp, ArrowDown, GripVertical, BarChart3, HelpCircle, PiggyBank, Car, CircleHelp, Check
} from 'lucide-react';

const formatCurrency = (value: number) => {
  if (isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDecimal = (value: number) => {
  if (isNaN(value)) return '0,00';
  if (Number.isInteger(value)) return value.toString();
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatVolume = (value: number) => {
  if (isNaN(value)) return '0,00';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
};

// Helper to get CSS Variable value
const getCssVar = (name: string) => {
  if (typeof window === 'undefined') return '#888888';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// --- METRIC DEFINITIONS FOR QUICK STATS ---
interface MetricDef {
  id: string;
  label: string;
  description: string;
  getValue: (stats: any) => string;
  getColorClass?: (stats: any) => string;
}

const METRIC_DEFINITIONS: Record<string, MetricDef> = {
  refuelCount: {
    id: 'refuelCount',
    label: 'Quantidade de Abastecimentos',
    description: 'Número total de registros de abastecimento no período selecionado.',
    getValue: (s) => String(s.refuelCount).padStart(2, '0')
  },
  costPerDay: {
    id: 'costPerDay',
    label: 'Custo/Dia (Período)',
    description: 'Custo diário médio calculado sobre o total de dias do período selecionado.',
    getValue: (s) => formatCurrency(s.costPerDayPeriod)
  },
  avgKmDay: {
    id: 'avgKmDay',
    label: 'Média Km/Dia',
    description: 'Média de quilômetros rodados por dia no período.',
    getValue: (s) => formatDecimal(s.avgKmPerDay) + ' km'
  },
  avgDaysRefuel: {
    id: 'avgDaysRefuel',
    label: 'Média Dias entre Abast.',
    description: 'Média de dias decorridos entre abastecimentos consecutivos.',
    getValue: (s) => formatDecimal(s.fuelStats['Média Geral']?.avgDaysBetweenPeriod || 0) + ' dias'
  },
  totalDiscounts: {
    id: 'totalDiscounts',
    label: 'Total de Descontos',
    description: 'Valor total economizado através de descontos de aplicativos e promoções.',
    getValue: (s) => formatCurrency(s.totalDiscountValue),
    getColorClass: () => 'text-success'
  },
  avgDiscount: {
    id: 'avgDiscount',
    label: 'Média de Descontos',
    description: 'Valor médio economizado por cada abastecimento que teve desconto aplicado.',
    getValue: (s) => formatCurrency(s.avgDiscountValue),
    getColorClass: () => 'text-success'
  }
};

const DEFAULT_METRIC_ORDER = [
  'refuelCount',
  'totalDiscounts',
  'avgDiscount',
  'costPerDay', 
  'avgKmDay',
  'avgDaysRefuel'
];

interface FuelStat {
  fuel: string;
  refuelCountPeriod: number;
  avgPricePeriod: number;
  maxPriceGlobal: number;
  maxPricePeriod: number;
  minPriceGlobal: number;
  minPricePeriod: number;
  costPerKmPeriod: number;
  costPerKmCurrentMonth: number;
  avgKmBetweenPeriod: number;
  avgDaysBetweenPeriod: number;
}

interface DashboardStats {
  refuelCount: number;
  totalSpent: number;
  totalLiters: number;
  avgEfficiency: number;
  totalKmTracked: number;
  avgKmPerDay: number;
  costPerDayPeriod: number;
  totalDiscountValue: number;
  avgDiscountValue: number;
  
  fuelStats: Record<string, FuelStat>;

  paymentStatsArray: { method: string; count: number; total: number }[];
  appStatsArray: { app: string; count: number; total: number }[];
  fuelDistributionArray: { label: string; value: number; color: string }[];
  monthlyExpenseChart: { label: string; value: number; displayValue: string; badge?: string | number }[];
  monthlyCountChart: { label: string; value: number; displayValue: string }[];
  monthlyFuelMix: Record<string, Record<string, number>>;
  availableMonths: string[];
  fuelKeys: string[];
  chartHistory: { 
     date: string; 
     label: string; 
     efficiency: number; 
     costPerKm: number; 
     volume: number; 
     price: number; 
     fuel: string;
     costPerDay: number;
  }[];
}

// --- COMPONENTS ---

const ChartSkeleton = () => (
  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-body-secondary bg-opacity-50 rounded" style={{minHeight: '200px'}}>
     <Loader2 className="animate-spin text-primary mb-2" size={32} />
     <span className="small text-muted fw-medium">Atualizando dados...</span>
  </div>
);

const ValueSkeleton = () => (
  <div className="placeholder-glow w-100">
    <span className="placeholder col-8 bg-secondary bg-opacity-25 rounded"></span>
  </div>
);

// Helper component for KPI Cards
const StatCard = ({ 
  icon, 
  colorClass, 
  label, 
  value, 
  subtext,
  description,
  loading = false,
  tooltipPos = 'hint--top'
}: { 
  icon: React.ReactNode, 
  colorClass: string, 
  label: string, 
  value: React.ReactNode, 
  subtext: string,
  description: string,
  loading?: boolean,
  tooltipPos?: string
}) => (
  <div className="card h-100 border-0 shadow-sm card-hover">
    <div className="card-body p-2 p-md-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center w-100">
            <div className={`p-2 rounded bg-opacity-10 d-flex align-items-center justify-content-center ${colorClass.replace('text-', 'bg-')} ${colorClass}`}>
              {React.cloneElement(icon as ReactElement<any>, { size: 20 })}
            </div>
            
            {/* Desktop Title & Help */}
            <div className="d-none d-sm-flex align-items-center ms-2">
               <h5 className="fw-bold mb-0">{label}</h5>
               <div className={`ms-1 d-flex align-items-center ${tooltipPos} hint--rounded hint--medium`} aria-label={description}>
                 <CircleHelp size={14} className="text-muted opacity-50 cursor-help" />
               </div>
            </div>

            {/* Mobile Title & Help (Right Aligned) */}
            <div className="d-flex d-sm-none align-items-center ms-auto">
               <span className="fw-bold text-muted text-uppercase text-end lh-1" style={{ fontSize: '0.65rem' }}>{label}</span>
               <div className="ms-1 d-flex align-items-center hint--left hint--rounded hint--medium" aria-label={description}>
                 <CircleHelp size={12} className="text-muted opacity-50 cursor-help" />
               </div>
            </div>
        </div>
      </div>
      
      <h3 className="fw-bold mb-1 fs-5 fs-lg-4 text-truncate">
        {loading ? <ValueSkeleton /> : value}
      </h3>
      <p className="text-muted mb-0 text-truncate" style={{ fontSize: '0.7rem' }}>
        {loading ? <span className="placeholder col-6 rounded"></span> : subtext}
      </p>
    </div>
  </div>
);

// Simple SVG Pie Chart Component
const PieChart = ({ data, loading = false }: { data: { label: string, value: number, color: string }[], loading?: boolean }) => {
  const [hoveredSlice, setHoveredSlice] = useState<{ label: string, value: number, percentage: string, x: number, y: number } | null>(null);

  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <div className="text-center text-muted py-4 small">Sem dados</div>;

  const total = data.reduce((acc, cur) => acc + cur.value, 0);
  let accumulatedAngle = 0;
  const radius = 80;
  const cx = 100;
  const cy = 100;

  // Process slices
  const slices = data.map((item) => {
    const angle = (item.value / total) * 2 * Math.PI;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle += angle;

    // Calculate coordinates
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    // Tooltip coordinates (centroid)
    const midAngle = startAngle + angle / 2;
    const tooltipRadius = radius * 0.7;
    const tx = cx + tooltipRadius * Math.cos(midAngle);
    const ty = cy + tooltipRadius * Math.sin(midAngle);

    // SVG Path
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const pathData = `M ${cx},${cy} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;

    // Determine unit
    const unit = item.label === 'Elétrico' ? 'KVA' : 'L';

    return { 
      ...item, 
      pathData, 
      percentage: ((item.value / total) * 100).toFixed(1),
      tx,
      ty,
      unit
    };
  });

  return (
    <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-4">
      <div className="position-relative flex-shrink-0" style={{ width: '160px', height: '160px' }}>
        <svg width="100%" height="100%" viewBox="0 0 200 200" className="d-block">
          {slices.map((slice, idx) => (
            <path 
              key={idx} 
              d={slice.pathData} 
              fill={slice.color} 
              stroke="#fff" 
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              opacity={hoveredSlice && hoveredSlice.label !== slice.label ? 0.5 : 1}
              onMouseEnter={() => setHoveredSlice({
                label: String(slice.label),
                value: slice.value,
                percentage: slice.percentage,
                x: slice.tx,
                y: slice.ty
              })}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <title>{`${slice.label}: ${formatVolume(slice.value)} ${slice.unit} (${slice.percentage}%)`}</title>
            </path>
          ))}
        </svg>
        {hoveredSlice && (
          <div 
            className="position-absolute bg-dark text-white p-2 rounded shadow-sm text-center pe-none"
            style={{
              left: `${(hoveredSlice.x / 200) * 100}%`,
              top: `${(hoveredSlice.y / 200) * 100}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: '0.75rem',
              zIndex: 1050,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <div className="fw-bold">{hoveredSlice.label}</div>
            <div>{formatVolume(hoveredSlice.value)}{hoveredSlice.label === 'Elétrico' ? 'KVA' : 'L'} ({hoveredSlice.percentage}%)</div>
          </div>
        )}
      </div>
      <div className="flex-grow-1 w-100 w-sm-auto">
         {/* Responsive Grid for Legend on Mobile, List on Desktop */}
         <div className="row row-cols-2 row-cols-sm-1 g-2">
            {data.map((item, idx) => (
               <div key={idx} className="col">
                 <div className="d-flex align-items-center justify-content-between small h-100 p-1 rounded hover-bg-light">
                    <div className="d-flex align-items-center text-truncate">
                       <span className="d-inline-block rounded-circle me-2 flex-shrink-0" style={{width: 10, height: 10, backgroundColor: item.color}}></span>
                       <span className="text-body fw-medium text-truncate" style={{maxWidth: '100px'}}>{String(item.label)}</span>
                    </div>
                    <span className="text-muted ms-2">{((item.value / total) * 100).toFixed(1)}%</span>
                 </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

// --- HELPER FOR CURVED LINE (CUBIC BEZIER) ---
const getBezierPath = (points: {x: number, y: number}[], height: number) => {
  if (points.length === 0) return { path: "", fillPath: "" };
  if (points.length === 1) return { path: "", fillPath: "" }; // Need at least 2 points

  // Simple logic: Control point is midpoint
  const controlPoint = (current: any, previous: any, next: any, reverse: boolean = false) => {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.2; // 0 to 1
    const o = {
      x: n.x - p.x,
      y: n.y - p.y
    };
    const r = reverse ? -1 : 1;
    return {
       x: current.x + (o.x * smoothing * r),
       y: current.y + (o.y * smoothing * r)
    };
  };

  const command = (point: any, i: number, a: any[]) => {
    if (i === 0) return `M ${point.x},${point.y}`;

    const cps = controlPoint(a[i - 1], a[i - 2], point, false);
    const cpe = controlPoint(point, a[i - 1], a[i + 1], true);

    return `C ${cps.x},${cps.y} ${cpe.x},${cpe.y} ${point.x},${point.y}`;
  };

  const d = points.reduce((acc, point, i, a) => acc + command(point, i, a), "");
  
  // Close the path for fill
  const last = points[points.length - 1];
  const first = points[0];
  const fillD = `${d} L ${last.x},${height} L ${first.x},${height} Z`;

  return { path: d, fillPath: fillD };
};

// Modern SVG Line Chart Component with Scanning Cursor
const SimpleLineChart = ({ 
  data, 
  lineColor = "#2563eb", 
  fuelColors = {},
  loading = false 
}: { 
  data: { label: string, value: number, date: string, fuel: string, unit: string }[], 
  lineColor?: string,
  fuelColors?: Record<string, string>,
  loading?: boolean
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (loading) return <ChartSkeleton />;
  if (data.length < 2) {
    return <div className="text-center text-muted py-5 small">Dados insuficientes neste período (mínimo 2 registros).</div>;
  }

  const height = 300;
  const width = 800; // ViewBox width
  const paddingX = 40;
  const paddingY = 40;

  const values = data.map(d => d.value);
  const minVal = Math.min(...values) * 0.95; 
  const maxVal = Math.max(...values) * 1.05; 
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.value - minVal) / range) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  const { path: linePath, fillPath: areaPath } = getBezierPath(points, height);

  // Mouse Move Handler for Scanning Cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate X relative to the SVG viewbox width (800)
    const clientX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = clientX * scaleX;

    // Find closest point
    let closestIndex = 0;
    let minDistance = Infinity;

    points.forEach((p, i) => {
      const dist = Math.abs(p.x - svgX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    });

    setActiveIndex(closestIndex);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  // Unit logic
  const getPointUnit = (point: any) => {
    if (point.fuel === 'Elétrico') {
      if (point.unit === 'L' || point.unit === 'Vol') return 'KVA';
      if (point.unit === 'Km/L' || point.unit === 'Km/Unid') return 'Km/KVA';
      if (point.unit === 'R$/L' || point.unit === 'R$/Unid') return 'R$/KVA';
    } else {
       if (point.unit === 'Vol') return 'L';
       if (point.unit === 'Km/Unid') return 'Km/L';
       if (point.unit === 'R$/Unid') return 'R$/L';
    }
    return point.unit;
  };
  
  // Dynamic color from props or fallback
  const getFuelColor = (fuelName: string) => fuelColors[fuelName] || '#888';
  const activeFuelColor = activePoint ? getFuelColor(activePoint.fuel) : '#888';

  return (
    <div 
       ref={containerRef}
       className="w-100 position-relative" 
       style={{ aspectRatio: '16/9', minHeight: '220px', maxHeight: '350px', cursor: 'crosshair' }}
       onMouseMove={handleMouseMove}
       onMouseLeave={handleMouseLeave}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-100 h-100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`fillGradient-${lineColor.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="1" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
           const y = height - paddingY - (t * (height - 2 * paddingY));
           return (
             <line key={t} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5" />
           );
        })}

        {/* Area Fill */}
        <path d={areaPath} fill={`url(#fillGradient-${lineColor.replace('#', '')})`} stroke="none" />

        {/* The Smooth Line */}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#dropShadow)" />

        {/* Scanning Cursor Line */}
        {activePoint && (
           <line 
             x1={activePoint.x} y1={paddingY} 
             x2={activePoint.x} y2={height - paddingY} 
             stroke="#94a3b8" strokeWidth="1" strokeDasharray="3" 
           />
        )}

        {/* Active Point Highlight */}
        {activePoint && (
          <g>
             <circle cx={activePoint.x} cy={activePoint.y} r="6" fill={lineColor} stroke="#fff" strokeWidth="2" />
             <circle cx={activePoint.x} cy={activePoint.y} r="12" fill={lineColor} opacity="0.2" className="animate-pulse" />
          </g>
        )}

        {/* X Axis Labels (Limit to 6) */}
        {points.filter((_, i) => {
            const step = Math.ceil(points.length / 6);
            return i % step === 0 || i === points.length - 1;
        }).map((p, i) => (
           <text key={i} x={p.x} y={height - 10} textAnchor="middle" fontSize="14" fontWeight="500" fill="#64748b" style={{pointerEvents: 'none'}}>
             {String(p.label)}
           </text>
        ))}
      </svg>

      {/* Modern Floating Tooltip */}
      {activePoint && (
        <div 
          className="position-absolute rounded shadow-lg p-2 text-center pe-none"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
            top: `${(activePoint.y / height) * 100}%`,
            transform: 'translate(-50%, -125%)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            border: `1px solid ${lineColor}`,
            zIndex: 1050,
            minWidth: '120px'
          }}
        >
          <div className="small text-muted fw-bold mb-1" style={{fontSize: '0.7rem'}}>{String(activePoint.date)}</div>
          
          <div className="d-flex align-items-end justify-content-center lh-1 mb-2">
             <span className="fw-bold fs-5 text-dark me-1">{formatDecimal(Number(activePoint.value))}</span>
             <span className="small text-secondary fw-medium" style={{fontSize: '0.7rem', paddingBottom: '2px'}}>{getPointUnit(activePoint)}</span>
          </div>

          <div className="d-flex align-items-center justify-content-center gap-2">
             <span className="badge rounded-pill fw-normal text-truncate" style={{backgroundColor: activeFuelColor, maxWidth: '100px'}}>
                {String(activePoint.fuel)}
             </span>
          </div>

          {/* Triangle Arrow */}
          <div 
            className="position-absolute start-50 translate-middle-x" 
            style={{ 
              bottom: '-5px', 
              width: 0, 
              height: 0, 
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `5px solid ${lineColor}`
            }} 
          ></div>
        </div>
      )}
    </div>
  );
};

// Bar Chart Component
const BarChart = ({ 
  data, 
  color = "bg-primary", 
  loading = false 
}: { 
  data: { label: string, value: number, displayValue: string, color?: string, badge?: string | number }[], 
  color?: string,
  loading?: boolean
}) => {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <div className="text-center text-muted py-4 small">Sem dados para exibir.</div>;
  
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="mt-4">
      {data.map((item, idx) => (
        <div key={idx} className="mb-3">
          <div className="d-flex justify-content-between text-muted small mb-1 align-items-center">
            <div className="d-flex align-items-center">
               <span>{String(item.label)}</span>
               {item.badge && (
                  <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 ms-2 rounded-pill fw-normal" style={{fontSize: '0.65em', padding: '0.25em 0.6em'}}>
                     {item.badge}
                  </span>
               )}
            </div>
            <span className="fw-medium text-body">{String(item.displayValue)}</span>
          </div>
          <div className="progress" style={{ height: '10px' }}>
            <div 
              className={`progress-bar ${!item.color ? color : ''}`} 
              role="progressbar" 
              style={{ 
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                backgroundColor: item.color ? item.color : undefined
              }}
              aria-valuenow={item.value} 
              aria-valuemin={0} 
              aria-valuemax={maxValue}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Define keys type
type ChartMetricKey = 'efficiency' | 'costPerKm' | 'costPerDay' | 'volume' | 'price';

const Dashboard: React.FC = () => {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Theme State
  const [colors, setColors] = useState({
     fuels: {} as Record<string, string>,
     metrics: {} as Record<string, string>
  });
  
  // New: Vehicle Filtering
  const [vehicleFilter, setVehicleFilter] = useState<string>('DEFAULT');
  const [availableVehicles, setAvailableVehicles] = useState<VehicleOption[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // Moved declaration here
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isConfigModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isConfigModalOpen]);

  // Load Colors from CSS Variables
  useEffect(() => {
    // Helper to get variable with fallback
    const getVar = (name: string, fallback: string) => {
       const val = getCssVar(name);
       return val ? val : fallback;
    };

    // Give DOM a tick to apply styles
    const timer = setTimeout(() => {
        setColors({
            fuels: {
                'Gasolina': getVar('--fuel-gasoline', '#ef4444'),
                'Gasolina Aditivada': getVar('--fuel-gas-additive', '#f97316'),
                'Etanol': getVar('--fuel-ethanol', '#22c55e'),
                'Diesel': getVar('--fuel-diesel', '#64748b'),
                'Diesel S10': getVar('--fuel-diesel-s10', '#475569'),
                'GNV': getVar('--fuel-gnv', '#eab308'),
                'Elétrico': getVar('--fuel-electric', '#3b82f6'),
                'Outros': getVar('--fuel-other', '#a855f7')
            },
            metrics: {
                efficiency: getVar('--metric-efficiency', '#10b981'),
                costPerKm: getVar('--metric-cost-km', '#f59e0b'),
                costPerDay: getVar('--metric-cost-day', '#ef4444'),
                volume: getVar('--metric-volume', '#3b82f6'),
                price: getVar('--metric-price', '#8b5cf6')
            }
        });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getFuelColor = (fuelName: string) => colors.fuels[fuelName] || colors.fuels['Outros'] || '#888';

  // --- CHART METRIC OPTIONS (Dynamic Colors) ---
  const chartMetricsOptions = useMemo(() => ({
    efficiency: { label: 'Eficiência (Km/L | Km/KVA)', color: colors.metrics.efficiency, unit: 'Km/Unid', icon: TrendingUp },
    costPerKm: { label: 'Custo por Km (R$/km)', color: colors.metrics.costPerKm, unit: 'R$/km', icon: DollarSign },
    costPerDay: { label: 'Custo Diário (R$/dia)', color: colors.metrics.costPerDay, unit: 'R$/dia', icon: CalendarClock },
    volume: { label: 'Volume (L / KVA)', color: colors.metrics.volume, unit: 'Vol', icon: Droplet },
    price: { label: 'Preço (R$/L | R$/KVA)', color: colors.metrics.price, unit: 'R$/Unid', icon:  Banknote},
  }), [colors]);

  const [efficiencyCount, setEfficiencyCount] = useState<string>('10');
  const [filterPeriod, setFilterPeriod] = useState<string>('thisMonth');

  // UI State - Collapse Toggles
  const [showEfficiencyChart, setShowEfficiencyChart] = useState(true);
  const [showFuelAnalysis, setShowFuelAnalysis] = useState(true);
  const [fuelAnalysisMode, setFuelAnalysisMode] = useState<'distribution' | 'mix'>('distribution');

  const [showQuickStats, setShowQuickStats] = useState(true);
  const [showDetailedStats, setShowDetailedStats] = useState(true);
  
  // New Grouped Toggle States
  const [showMonthlyAnalysis, setShowMonthlyAnalysis] = useState(true);
  const [showOperationalStats, setShowOperationalStats] = useState(true);

  // Custom Metric Order State
  const [metricOrder, setMetricOrder] = useState<string[]>(DEFAULT_METRIC_ORDER);
  
  // Evolution Chart Metric
  const [evolutionMetric, setEvolutionMetric] = useState<ChartMetricKey>('efficiency');

  // Initial Load (Records and Vehicles)
  useEffect(() => {
    const loadAll = async () => {
      try {
        setIsLoadingVehicles(true);
        const [recordsData, optionsData] = await Promise.all([
             fetchRecords(),
             fetchFormOptions()
        ]);
        
        // Active Records
        const activeData = recordsData.filter(r => r.active);
        setRecords(activeData.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()));

        // Vehicles
        if (optionsData && optionsData.vehicles.length > 0) {
            setAvailableVehicles(optionsData.vehicles);
            // Default to the default car
            const defaultCar = optionsData.vehicles.find(v => v.isDefault);
            if (defaultCar) setVehicleFilter(defaultCar.name);
            else setVehicleFilter(optionsData.vehicles[0].name);
        } else {
             // Fallback if no config loaded
             setVehicleFilter('ALL');
        }

      } catch (error) {
        console.error(error);
      } finally {
        setInitialLoading(false);
        setIsLoadingVehicles(false);
      }
    };
    loadAll();

    // Load metric order from LS
    const savedOrder = localStorage.getItem('fuel_tracker_metric_order');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        const merged = Array.from(new Set([...parsed, ...DEFAULT_METRIC_ORDER]));
        const validKeys = merged.filter(k => METRIC_DEFINITIONS[k]);
        setMetricOrder(validKeys.length > 0 ? validKeys : DEFAULT_METRIC_ORDER);
      } catch (e) {
        setMetricOrder(DEFAULT_METRIC_ORDER);
      }
    }
    
    // Load chart metric pref
    const savedChartMetric = localStorage.getItem('fuel_tracker_evolution_metric');
    if (savedChartMetric && ['efficiency','costPerKm','costPerDay','volume','price'].includes(savedChartMetric)) {
       setEvolutionMetric(savedChartMetric as ChartMetricKey);
    }
  }, []);

  // Save metric order when changed
  const handleSaveOrder = (newOrder: string[]) => {
    setMetricOrder(newOrder);
    localStorage.setItem('fuel_tracker_metric_order', JSON.stringify(newOrder));
  };
  
  const handleChartMetricChange = (metric: string) => {
     setEvolutionMetric(metric as ChartMetricKey);
     localStorage.setItem('fuel_tracker_evolution_metric', metric);
  };

  const moveMetric = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...metricOrder];
    const item = newOrder[index];
    
    if (direction === 'up') {
      if (index === 0) return;
      newOrder[index] = newOrder[index - 1];
      newOrder[index - 1] = item;
    } else {
      if (index === newOrder.length - 1) return;
      newOrder[index] = newOrder[index + 1];
      newOrder[index + 1] = item;
    }
    
    handleSaveOrder(newOrder);
  };

  // Loading effect when filter changes
  useEffect(() => {
    if (!initialLoading) {
      setIsFiltering(true);
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [filterPeriod, efficiencyCount, vehicleFilter, initialLoading]);

  // --- FILTERING (DATE & VEHICLE) ---
  const filteredRecords = useMemo(() => {
    let data = records;

    // 1. Vehicle Filter
    if (vehicleFilter !== 'ALL') {
        data = data.filter(r => r.veiculo === vehicleFilter);
    }

    // 2. Date Filter
    if (filterPeriod === 'all') return data;

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    return data.filter(r => {
      const [year, month, day] = r.data.split('-').map(Number);
      const rDate = new Date(year, month - 1, day);
      
      if (filterPeriod.startsWith('month-')) {
        const monthIndex = parseInt(filterPeriod.split('-')[1]);
        return rDate.getMonth() === monthIndex && rDate.getFullYear() === now.getFullYear();
      }

      switch (filterPeriod) {
        case '7days': {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          sevenDaysAgo.setHours(0,0,0,0);
          return rDate >= sevenDaysAgo && rDate <= now;
        }
        case 'thisMonth': {
          const today = new Date();
          return rDate.getMonth() === today.getMonth() && rDate.getFullYear() === today.getFullYear();
        }
        case 'lastMonth': {
          const today = new Date();
          const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          return rDate.getMonth() === lastMonthDate.getMonth() && rDate.getFullYear() === lastMonthDate.getFullYear();
        }
        case 'thisYear': {
          const today = new Date();
          return rDate.getFullYear() === today.getFullYear();
        }
        default:
          return true;
      }
    });
  }, [records, filterPeriod, vehicleFilter]);

  // --- STATISTICS CALCULATIONS ---
  const stats = useMemo<DashboardStats | null>(() => {
    if (filteredRecords.length === 0) return null;

    const dataToProcess = filteredRecords;
    const refuelCount = dataToProcess.length;

    // Basic Aggregates
    const totalSpent = dataToProcess.reduce((acc, r) => acc + r.total, 0);
    const totalLiters = dataToProcess.reduce((acc, r) => acc + r.qtd, 0);
    
    // Efficiency & Intervals & Evolution Chart
    let totalDistance = 0;
    let litersForEfficiency = 0;
    let totalDaysDiff = 0;
    let intervalsCount = 0;
    
    // Discount calculations
    let totalDiscount = 0;
    let discountTxCount = 0;

    const chartHistory: { 
       date: string; 
       label: string; 
       efficiency: number; 
       costPerKm: number; 
       volume: number; 
       price: number; 
       fuel: string;
       costPerDay: number;
    }[] = [];

    // For km/day calculation
    const firstDate = new Date(dataToProcess[0].data).getTime();
    const lastDate = new Date(dataToProcess[dataToProcess.length - 1].data).getTime();
    const totalDateRangeDays = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));

    // Iterate once for discounts and chart builder (partially)
    dataToProcess.forEach(r => {
        // Calculate Discount
        if (r.precoBomba && r.precoBomba > r.precoL) {
             const discount = (r.precoBomba - r.precoL) * r.qtd;
             totalDiscount += discount;
             discountTxCount++;
        }
    });

    for (let i = 1; i < dataToProcess.length; i++) {
      const cur = dataToProcess[i];
      const prev = dataToProcess[i - 1];

      // Important: Ensure we are comparing same vehicle for efficiency
      if (cur.veiculo !== prev.veiculo && vehicleFilter === 'ALL') {
          continue; // Skip calculating efficiency between different cars
      }

      // Calculate elapsed days for interval
      const curTime = new Date(cur.data).getTime();
      const prevTime = new Date(prev.data).getTime();
      const diffTime = Math.abs(curTime - prevTime);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const daysForCalc = Math.max(1, diffDays);
      const costPerDayInterval = cur.total / daysForCalc;

      totalDaysDiff += diffDays;
      intervalsCount++;

      // Ensure valid odometer progression for efficiency calculation
      if (cur.km > prev.km) {
        const dist = cur.km - prev.km;
        totalDistance += dist;
        litersForEfficiency += cur.qtd;

        const kmL = dist / cur.qtd;
        const costKm = cur.total / dist; 
        
        chartHistory.push({
          date: cur.data,
          label: new Date(cur.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          efficiency: kmL,
          costPerKm: costKm,
          volume: cur.qtd,
          price: cur.precoL,
          fuel: cur.combustivel,
          costPerDay: costPerDayInterval
        });
      }
    }
    
    const avgEfficiency = litersForEfficiency > 0 ? totalDistance / litersForEfficiency : 0;
    // Total KM Tracked needs to be sum of diffs if filtering all, or simple diff if single vehicle
    const totalKmTracked = totalDistance; 
    
    // Avg Km per day
    const avgKmPerDay = totalKmTracked / totalDateRangeDays;
    const costPerDayPeriod = totalSpent / totalDateRangeDays;
    
    // Discounts
    const totalDiscountValue = totalDiscount;
    const avgDiscountValue = discountTxCount > 0 ? totalDiscount / discountTxCount : 0;

    // --- NEW FUEL STATS LOGIC ---
    const fuelStats: Record<string, FuelStat> = {};
    const fuelsInPeriod = Array.from(new Set(dataToProcess.map(r => r.combustivel)));

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // General Average Calc for Quick Stats
    const totalAvgDaysBetween = intervalsCount > 0 ? totalDaysDiff / intervalsCount : 0;
    fuelStats['Média Geral'] = {
        fuel: 'Geral',
        refuelCountPeriod: 0,
        avgPricePeriod: 0, maxPriceGlobal: 0, maxPricePeriod: 0, minPriceGlobal: 0, minPricePeriod: 0,
        costPerKmPeriod: 0, costPerKmCurrentMonth: 0, avgKmBetweenPeriod: 0, 
        avgDaysBetweenPeriod: totalAvgDaysBetween
    };

    fuelsInPeriod.forEach(fuel => {
        // Filter lists
        const fPeriodRecs = dataToProcess.filter(r => r.combustivel === fuel);
        const fGlobalRecs = records.filter(r => r.combustivel === fuel && (vehicleFilter === 'ALL' || r.veiculo === vehicleFilter));

        // Prices
        const pricesPeriod = fPeriodRecs.map(r => r.precoL);
        const pricesGlobal = fGlobalRecs.map(r => r.precoL);

        const avgPricePeriod = pricesPeriod.length ? pricesPeriod.reduce((a,b)=>a+b,0)/pricesPeriod.length : 0;
        const maxPriceGlobal = pricesGlobal.length ? Math.max(...pricesGlobal) : 0;
        const maxPricePeriod = pricesPeriod.length ? Math.max(...pricesPeriod) : 0;
        const minPriceGlobal = pricesGlobal.length ? Math.min(...pricesGlobal) : 0;
        const minPricePeriod = pricesPeriod.length ? Math.min(...pricesPeriod) : 0;

        // Interval Metrics Calculation
        let sumTotalPeriod = 0;
        let sumDistPeriod = 0;
        let sumDaysPeriod = 0;
        let countIntervalsPeriod = 0;
        
        let sumTotalMonth = 0;
        let sumDistMonth = 0;

        fPeriodRecs.forEach(curr => {
            // Stats Period Calculation
            const idx = records.findIndex(r => r.id === curr.id);
            if (idx > 0) {
                const prev = records[idx-1];
                if (curr.veiculo === prev.veiculo) { // Check same car
                    if (curr.km > prev.km) {
                        const dKm = curr.km - prev.km;
                        const dTime = Math.abs(new Date(curr.data).getTime() - new Date(prev.data).getTime());
                        const dDays = Math.ceil(dTime / (1000*60*60*24));

                        sumTotalPeriod += curr.total;
                        sumDistPeriod += dKm;
                        sumDaysPeriod += Math.max(1, dDays);
                        countIntervalsPeriod++;

                        // Month Check
                        const [y, m, d] = curr.data.split('-').map(Number);
                        const rDate = new Date(y, m - 1, d);
                        if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
                            sumTotalMonth += curr.total;
                            sumDistMonth += dKm;
                        }
                    }
                }
            }
        });

        const costPerKmPeriod = sumDistPeriod > 0 ? sumTotalPeriod / sumDistPeriod : 0;
        const avgKmBetweenPeriod = countIntervalsPeriod > 0 ? sumDistPeriod / countIntervalsPeriod : 0;
        const avgDaysBetweenPeriod = countIntervalsPeriod > 0 ? sumDaysPeriod / countIntervalsPeriod : 0;
        const costPerKmCurrentMonth = sumDistMonth > 0 ? sumTotalMonth / sumDistMonth : 0;

        fuelStats[fuel] = {
            fuel,
            refuelCountPeriod: fPeriodRecs.length,
            avgPricePeriod,
            maxPriceGlobal,
            maxPricePeriod,
            minPriceGlobal,
            minPricePeriod,
            costPerKmPeriod,
            costPerKmCurrentMonth,
            avgKmBetweenPeriod,
            avgDaysBetweenPeriod
        };
    });

    // Breakdown: Payment Methods
    const paymentStats: Record<string, { count: number, total: number }> = {};
    dataToProcess.forEach(r => {
      if (!paymentStats[r.formaPagto]) paymentStats[r.formaPagto] = { count: 0, total: 0 };
      paymentStats[r.formaPagto].count++;
      paymentStats[r.formaPagto].total += r.total;
    });
    const paymentStatsArray = Object.entries(paymentStats).map(([method, data]) => ({
      method, ...data
    })).sort((a, b) => b.total - a.total);

    // Breakdown: Apps
    const appStats: Record<string, { count: number, total: number }> = {};
    dataToProcess.filter(r => r.app).forEach(r => {
      const appName = r.app!;
      if (!appStats[appName]) appStats[appName] = { count: 0, total: 0 };
      appStats[appName].count++;
      appStats[appName].total += r.total;
    });
    const appStatsArray = Object.entries(appStats).map(([app, data]) => ({
      app, ...data
    })).sort((a, b) => b.total - a.total);

    // Breakdown: Fuel Distribution (General)
    const fuelDistribution: Record<string, number> = {};
    dataToProcess.forEach(r => {
       fuelDistribution[r.combustivel] = (fuelDistribution[r.combustivel] || 0) + r.qtd;
    });
    const fuelDistributionArray = Object.entries(fuelDistribution).map(([label, value]) => ({
       label,
       value,
       color: getFuelColor(label)
    })).sort((a, b) => b.value - a.value);

    // Monthly Calculations
    const monthlyExpenses: Record<string, number> = {};
    const monthlyLiters: Record<string, number> = {};
    const monthlyCounts: Record<string, number> = {};
    const monthlyFuelMix: Record<string, Record<string, number>> = {}; // YYYY-MM -> Fuel -> Qty

    dataToProcess.forEach(r => {
      const key = r.data.substring(0, 7); // YYYY-MM
      monthlyExpenses[key] = (monthlyExpenses[key] || 0) + r.total;
      monthlyLiters[key] = (monthlyLiters[key] || 0) + r.qtd;
      monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
      
      if (!monthlyFuelMix[key]) monthlyFuelMix[key] = {};
      monthlyFuelMix[key][r.combustivel] = (monthlyFuelMix[key][r.combustivel] || 0) + r.qtd;
    });

    // Charts Data
    const sortedMonths = Object.keys(monthlyExpenses).sort();
    const displayMonths = filterPeriod === 'all' ? sortedMonths.slice(-12) : sortedMonths;
    
    const monthlyExpenseChart = displayMonths.map(m => {
      const [y, monthNum] = m.split('-');
      const dateObj = new Date(parseInt(y), parseInt(monthNum) - 1);
      const label = dateObj.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      const count = monthlyCounts[m];
      return {
        label: label.toUpperCase(),
        value: monthlyExpenses[m],
        displayValue: formatCurrency(monthlyExpenses[m]),
        badge: `${count} ${count === 1 ? 'vez' : 'vezes'}`
      };
    });

    const monthlyCountChart = displayMonths.map(m => {
      const [y, monthNum] = m.split('-');
      const dateObj = new Date(parseInt(y), parseInt(monthNum) - 1);
      const label = dateObj.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      return {
        label: label.toUpperCase(),
        value: monthlyCounts[m],
        displayValue: monthlyCounts[m].toString()
      };
    });

    const fuelKeys = Array.from(new Set(dataToProcess.map(r => r.combustivel)));
    const availableMonths = sortedMonths.slice().reverse();

    return {
      refuelCount,
      totalSpent,
      totalLiters,
      avgEfficiency,
      totalKmTracked,
      avgKmPerDay,
      costPerDayPeriod,
      totalDiscountValue,
      avgDiscountValue,
      fuelStats,
      paymentStatsArray,
      appStatsArray,
      fuelDistributionArray,
      monthlyExpenseChart,
      monthlyCountChart,
      monthlyFuelMix,
      availableMonths,
      fuelKeys,
      chartHistory
    };
  }, [filteredRecords, filterPeriod, records, colors, vehicleFilter]);

  // Determine Monthly Fuel Data based on Global Filtered Distribution
  // Use stats.fuelDistributionArray which reflects the filtered period
  const monthlyFuelData = useMemo(() => {
    if (!stats) return [];
    
    const totalVolume = stats.totalLiters;
    
    return stats.fuelDistributionArray
      .map((item) => ({
        label: item.label,
        value: item.value,
        displayValue: `${formatVolume(item.value)} ${item.label === 'Elétrico' ? 'KVA' : 'L'}`,
        color: item.color,
        badge: totalVolume > 0 ? `${((item.value / totalVolume) * 100).toFixed(1)}%` : '0%'
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  // Prepare Chart Data
  const chartData = useMemo(() => {
    if (!stats) return [];
    
    let data = stats.chartHistory;
    if (efficiencyCount !== 'all') {
      data = data.slice(-parseInt(efficiencyCount));
    }
    
    const metricKey = evolutionMetric as keyof typeof chartMetricsOptions;

    return data.map((d: any) => ({
       label: d.label,
       value: d[metricKey],
       date: new Date(d.date).toLocaleDateString('pt-BR'),
       fuel: d.fuel,
       unit: chartMetricsOptions[metricKey].unit
    }));
  }, [stats, efficiencyCount, evolutionMetric, chartMetricsOptions]);
  
  const CurrentMetricIcon = chartMetricsOptions[evolutionMetric].icon;

  if (initialLoading) {
     return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '300px' }}>
        <Loader2 className="animate-spin mb-3 text-primary" size={40} />
        <p className="text-secondary">Calculando estatísticas...</p>
      </div>
    );
  }

  // Helper for fuel stat row
  const FuelStatRow = ({ label, value, tooltip, className }: { label: string, value: string, tooltip: string, className?: string }) => (
    <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
       <div className="d-flex align-items-center gap-1">
          <span className="text-muted small">{label}</span>
          <div className="d-flex align-items-center hint--top-left hint--rounded hint--medium" aria-label={tooltip}>
             <CircleHelp size={12} className="text-muted opacity-50 cursor-help" />
          </div>
       </div>
       <span className={`fw-medium text-end ${className || ''}`} style={{fontSize: '0.9rem'}}>{value}</span>
    </div>
  );

  return (
    <div className="animate-fade-in pb-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="h4 fw-bold mb-0">Dashboard</h2>
          <span className="text-muted small">Visão Geral e Estatísticas</span>
        </div>
        
        <div className="d-flex gap-2 flex-column flex-sm-row">
            {/* Vehicle Filter */}
            <div className="bg-body-secondary p-1 rounded d-flex align-items-center w-100 w-md-auto">
              <span className="px-2 text-muted"><Car size={18} /></span>
              <select 
                className="form-select form-select-sm border-0 bg-transparent fw-medium" 
                style={{boxShadow: 'none', minWidth: '160px'}}
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                disabled={isLoadingVehicles}
              >
                <option value="ALL">Todos os veículos</option>
                {availableVehicles.map(v => (
                   <option key={v.name} value={v.name}>{v.name} {v.isDefault ? '(Padrão)' : ''}</option>
                ))}
              </select>
            </div>

            {/* Global Date Filter */}
            <div className="bg-body-secondary p-1 rounded d-flex align-items-center w-100 w-md-auto">
              <span className="px-2 text-muted"><CalendarRange size={18} /></span>
              <select 
                className="form-select form-select-sm border-0 bg-transparent fw-medium" 
                style={{boxShadow: 'none', minWidth: '160px'}}
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
              >
                <option value="all">Todo o período</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="thisMonth">Este mês</option>
                <option value="lastMonth">Mês passado</option>
                <option value="thisYear">Este ano</option>
                <hr />
                <optgroup label={`Meses de ${new Date().getFullYear()}`}>
                    {MONTH_NAMES.map((month, index) => (
                        <option key={index} value={`month-${index}`}>{month}</option>
                    ))}
                </optgroup>
              </select>
            </div>
        </div>
      </div>

      {(!stats || filteredRecords.length === 0) ? (
        <div className="d-flex flex-column align-items-center justify-content-center text-center py-5 card border-0 shadow-sm">
           <AlertCircle size={40} className="mb-3 text-secondary" />
           <h5 className="text-secondary fw-normal">Nenhum dado encontrado.</h5>
           <p className="text-muted small">
             {records.length === 0 
               ? "Insira registros de abastecimento para visualizar o dashboard." 
               : "Não há registros para o período/veículo selecionado."}
           </p>
        </div>
      ) : (
        <>
          {/* ROW 1: MAIN KPIS */}
          <div className="row g-2 g-md-3 mb-4">
            <div className="col-6 col-xl-3">
              <StatCard 
                icon={<DollarSign />}
                colorClass="text-primary"
                label="Total Gasto"
                value={formatCurrency(stats.totalSpent)}
                subtext="No período"
                description="Soma de todo o valor financeiro pago em todos os abastecimentos do período."
                loading={isFiltering}
                tooltipPos="hint--bottom-left"
              />
            </div>
            <div className="col-6 col-xl-3">
              <StatCard 
                icon={<Droplet />}
                colorClass="text-primary"
                label="Volume Total"
                value={`${formatVolume(stats.totalLiters)}`}
                subtext="Litros + KVA"
                description="Quantidade total de combustível (em litros ou KVA) abastecida no período."
                loading={isFiltering}
                tooltipPos="hint--bottom-right"
              />
            </div>
            <div className="col-6 col-xl-3">
              <StatCard 
                icon={<Milestone />}
                colorClass="text-primary"
                label="Km Rodados"
                value={`${stats.totalKmTracked} km`}
                subtext="Distância percorrida"
                description="Diferença entre o último e o primeiro odômetro registrado no período (para o mesmo veículo)."
                loading={isFiltering}
                tooltipPos="hint--bottom-left"
              />
            </div>
            <div className="col-6 col-xl-3">
              <StatCard 
                icon={<Gauge />}
                colorClass="text-primary"
                label="Eficiência Média"
                value={
                  <span>
                    {formatDecimal(stats.avgEfficiency)} <span className="fs-6 fw-normal text-muted d-none d-sm-inline">Km/Unid</span>
                  </span>
                }
                subtext="Km/L ou Km/KVA"
                description="Média de desempenho baseada nos registros do período."
                loading={isFiltering}
                tooltipPos="hint--bottom-right"
              />
            </div>
          </div>

          {/* ROW 1.25: QUICK STATS (Moved here as requested) */}
          <div className="row mb-4">
             <div className="col-12">
               <div className="card border-0 shadow-sm h-100">
                  <div 
                    className="card-body p-3 p-md-4 d-flex align-items-center justify-content-between cursor-pointer" 
                    onClick={() => setShowQuickStats(!showQuickStats)}
                  >
                     <div className="d-flex align-items-center justify-content-between w-100">
                        <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center justify-content-center">
                                <Zap className="text-warning me-2" size={20} />
                            </div>
                            <h5 className="fw-bold mb-0">Estatísticas Rápidas</h5>
                            <div className="ms-2 hint--top hint--rounded hint--medium d-flex align-items-center" aria-label="Resumo dos principais indicadores de desempenho e custos.">
                                <CircleHelp size={16} className="text-muted opacity-50 cursor-help" />
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button 
                              className="btn btn-sm btn-link text-muted p-1" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsConfigModalOpen(true);
                              }}
                              title="Personalizar Ordem"
                            >
                              <Settings size={18} />
                            </button>
                            <div className="text-muted">
                               {showQuickStats ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>
                     </div>
                  </div>
                  
                  {showQuickStats && (
                    <div className="card-body p-3 p-md-4 pt-0 border-top-0 animate-fade-in">
                       <ul className="list-group list-group-flush">
                          {metricOrder.map(metricId => {
                             const def = METRIC_DEFINITIONS[metricId];
                             if (!def) return null;
                             const colorClass = def.getColorClass ? def.getColorClass(stats) : '';
                             return (
                               <li key={metricId} className="list-group-item d-flex justify-content-between align-items-center px-0 animate-fade-in py-2">
                                  <div className="d-flex align-items-center gap-1">
                                      <span className="text-muted small">
                                        {metricId === 'refuelCount' ? (
                                          <>
                                            <span className="d-none d-sm-inline">{def.label}</span>
                                            <span className="d-inline d-sm-none">Qtd Abastecimentos</span>
                                          </>
                                        ) : (
                                          def.label
                                        )}
                                      </span>
                                      <div className="d-flex align-items-center hint--top-right hint--rounded hint--medium" aria-label={def.description}>
                                          <CircleHelp size={12} className="text-muted opacity-50 cursor-help" />
                                      </div>
                                  </div>
                                  <span className={`fw-medium ${colorClass}`}>{def.getValue(stats)}</span>
                               </li>
                             );
                          })}
                       </ul>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* ROW 1.5: EVOLUTION CHART (COLLAPSIBLE) */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                  {/* Header: Title Only ********************/}
                  <div 
                    className="card-body p-3 p-md-4 d-flex align-items-center justify-content-between cursor-pointer border-bottom-0"
                    onClick={() => setShowEfficiencyChart(!showEfficiencyChart)}
                  >
                      <div className="d-flex align-items-center">
                         <div className="d-flex align-items-center justify-content-center">
                            <BarChart3 className="text-secondary me-2" size={24} />
                         </div>
                         <h5 className="fw-bold mb-0 fs-5 fs-md-4">Evolução e Desempenho</h5>
                         <div className="ms-2 hint--top hint--rounded hint--medium d-flex align-items-center" aria-label="Evolução da métrica selecionada ao longo do tempo.">
                            <CircleHelp size={16} className="text-muted opacity-50 cursor-help" />
                         </div>
                      </div>
                      <div className="text-muted">
                        {showEfficiencyChart ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                  </div>
                  
                  {/* Content */}
                  {showEfficiencyChart && (
                    <div className="card-body p-3 p-md-4 pt-0 animate-fade-in">
                        {/* New Control Toolbar inside Body */}
                        <div className="d-flex flex-column flex-sm-row gap-3 mb-4 bg-body-secondary p-3 rounded align-items-center">
                            {/* Metric Selector */}
                            <div className="flex-grow-1 w-100 w-sm-auto">
                                <label className="small text-muted fw-bold mb-1 d-block text-uppercase" style={{fontSize: '0.65rem'}}>Métrica Visualizada</label>
                                <div className="d-flex align-items-center">
                                    <CurrentMetricIcon size={18} className="me-2" style={{color: chartMetricsOptions[evolutionMetric].color}} />
                                    <select 
                                       className="form-select form-select-sm border-0 bg-white fw-medium shadow-sm w-100"
                                       value={evolutionMetric}
                                       onChange={(e) => handleChartMetricChange(e.target.value)}
                                    >
                                       {Object.entries(chartMetricsOptions).map(([key, config]) => (
                                          <option key={key} value={key}>{config.label}</option>
                                       ))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Data Points Selector */}
                            <div className="w-100 w-sm-auto">
                                <label className="small text-muted fw-bold mb-1 d-block text-uppercase" style={{fontSize: '0.65rem'}}>Período</label>
                                <select 
                                    className="form-select form-select-sm border-0 bg-white fw-medium shadow-sm"
                                    value={efficiencyCount}
                                    onChange={(e) => setEfficiencyCount(e.target.value)}
                                    style={{minWidth: '120px'}}
                                 >
                                    <option value="5">Últimos 5</option>
                                    <option value="10">Últimos 10</option>
                                    <option value="20">Últimos 20</option>
                                    <option value="50">Últimos 50</option>
                                    <option value="all">Todo o histórico</option>
                                 </select>
                            </div>
                        </div>
                        
                        <SimpleLineChart 
                          data={chartData} 
                          lineColor={chartMetricsOptions[evolutionMetric].color}
                          fuelColors={colors.fuels}
                          loading={isFiltering} 
                        />
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* ROW 2: FUEL ANALYSIS GROUP (Unified Card) - Only show if mix > 1 */}
          {stats.fuelDistributionArray.length > 1 && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm h-100">
                  <div 
                    className="card-body p-3 p-md-4 d-flex align-items-center justify-content-between cursor-pointer"
                    onClick={() => setShowFuelAnalysis(!showFuelAnalysis)}
                  >
                    <div className="d-flex align-items-center">
                        <div className="d-flex align-items-center justify-content-center">
                            <Fuel className="text-primary me-2" size={20} />
                        </div>
                        <h5 className="fw-bold mb-0">Análise de Volume de Combustível</h5>
                        <div className="ms-2 hint--top hint--rounded hint--medium d-flex align-items-center" aria-label="Visualização do volume abastecido por tipo de combustível.">
                            <CircleHelp size={16} className="text-muted opacity-50 cursor-help" />
                        </div>
                    </div>
                    <div className="text-muted">
                        {showFuelAnalysis ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {showFuelAnalysis && (
                    <div className="card-body p-3 p-md-4 pt-0 border-top-0 animate-fade-in">
                        {/* Control Toolbar */}
                        <div className="d-flex flex-column flex-sm-row gap-3 mb-4 bg-body-secondary p-3 rounded align-items-center">
                            <div className="flex-grow-1 w-100 w-sm-auto">
                                <label className="small text-muted fw-bold mb-1 d-block text-uppercase" style={{fontSize: '0.65rem'}}>Modo de Visualização</label>
                                <div className="btn-group w-100">
                                  <button 
                                    className={`btn btn-sm d-flex align-items-center justify-content-center ${fuelAnalysisMode === 'distribution' ? 'btn-white shadow-sm fw-bold' : 'btn-transparent text-muted'}`}
                                    onClick={() => setFuelAnalysisMode('distribution')}
                                  >
                                    <PieChartIcon size={16} className="me-2" />
                                    Visão Geral (Pizza)
                                  </button>
                                  <button 
                                    className={`btn btn-sm d-flex align-items-center justify-content-center ${fuelAnalysisMode === 'mix' ? 'btn-white shadow-sm fw-bold' : 'btn-transparent text-muted'}`}
                                    onClick={() => setFuelAnalysisMode('mix')}
                                  >
                                    <BarChart3 size={16} className="me-2" />
                                    Visão Mensal (Barras)
                                  </button>
                                </div>
                            </div>
                        </div>

                        {/* Chart Content */}
                        {fuelAnalysisMode === 'distribution' ? (
                            <div className="animate-fade-in">
                              <PieChart data={stats.fuelDistributionArray} loading={isFiltering} />
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                              <BarChart data={monthlyFuelData} loading={isFiltering} />
                            </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DETAILED FUEL PERFORMANCE (FULL WIDTH) */}
          <div className="row mb-4">
             <div className="col-12">
                <div className="card border-0 shadow-sm">
                   <div 
                      className="card-body p-3 p-md-4 d-flex align-items-center justify-content-between cursor-pointer"
                      onClick={() => setShowDetailedStats(!showDetailedStats)}
                   >
                      <div className="d-flex align-items-center">
                         <div className="d-flex align-items-center justify-content-center">
                             <TrendingUp className="text-success me-2" size={24} />
                         </div>
                         <h5 className="fw-bold mb-0">Desempenho por Combustível</h5>
                         <div className="ms-2 hint--top hint--rounded hint--medium d-flex align-items-center" aria-label="Métricas detalhadas separadas por tipo de combustível abastecido.">
                            <CircleHelp size={16} className="text-muted opacity-50 cursor-help" />
                         </div>
                      </div>
                      <div className="text-muted">
                         {showDetailedStats ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                   </div>

                   {showDetailedStats && (
                      <div className="card-body p-3 p-md-4 pt-0 border-top-0 animate-fade-in">
                         {isFiltering ? <ChartSkeleton /> : (
                            <div className="row g-4">
                               {(Object.values(stats.fuelStats) as FuelStat[])
                                  .filter(fStat => fStat.fuel !== 'Geral') // Don't show General stats here if we have detailed ones
                                  .map((fStat) => (
                                  <div key={fStat.fuel} className="col-md col-xl">
                                     <div className="h-100 border rounded p-3 bg-light bg-opacity-25">
                                        <div className="d-flex align-items-center mb-3">
                                           <div className="rounded-circle me-2" style={{width: 12, height: 12, backgroundColor: getFuelColor(fStat.fuel)}}></div>
                                           <h6 className="fw-bold mb-0">{fStat.fuel}</h6>
                                        </div>
                                        
                                        <div className="d-flex flex-column gap-1">
                                           <FuelStatRow 
                                              label="Qtd. Abastecimentos" 
                                              value={String(fStat.refuelCountPeriod).padStart(2, '0')}
                                              tooltip="Quantidade de abastecimentos registrados para este combustível no período selecionado." 
                                           />
                                           <FuelStatRow 
                                              label="Média de preço (período)" 
                                              value={formatCurrency(fStat.avgPricePeriod)}
                                              tooltip="Preço médio por litro/unidade considerando apenas os abastecimentos no período selecionado." 
                                           />
                                           <FuelStatRow
                                              className="text-danger"
                                              label="Maior preço pago (geral)" 
                                              value={formatCurrency(fStat.maxPriceGlobal)}
                                              tooltip="Maior preço por unidade já registrado em todo o histórico." 
                                           />
                                           <FuelStatRow 
                                              className="text-danger"
                                              label="Maior preço pago (período)" 
                                              value={formatCurrency(fStat.maxPricePeriod)}
                                              tooltip="Maior preço por unidade registrado no período selecionado." 
                                           />
                                           <FuelStatRow 
                                              className="text-success"
                                              label="Menor preço pago (geral)" 
                                              value={formatCurrency(fStat.minPriceGlobal)}
                                              tooltip="Menor preço por unidade já registrado em todo o histórico." 
                                           />
                                           <FuelStatRow 
                                              className="text-success"
                                              label="Menor preço pago (período)" 
                                              value={formatCurrency(fStat.minPricePeriod)}
                                              tooltip="Menor preço por unidade registrado no período selecionado." 
                                           />
                                           <FuelStatRow 
                                              label="Custo/Km (período)" 
                                              value={fStat.costPerKmPeriod > 0 ? `${formatCurrency(fStat.costPerKmPeriod)}/km` : '-'}
                                              tooltip="Custo médio para rodar 1km neste período (Total Pago / Km Rodados)." 
                                           />
                                           {/*
                                            <FuelStatRow 
                                              label="Custo/Km (Mês atual)" 
                                              value={fStat.costPerKmCurrentMonth > 0 ? `${formatCurrency(fStat.costPerKmCurrentMonth)}/km` : '-'}
                                              tooltip="Custo médio por km considerando apenas registros do mês corrente." 
                                           />
                                            */}
                                           <FuelStatRow 
                                              label="Média Km entre abastecimentos" 
                                              value={`${formatDecimal(fStat.avgKmBetweenPeriod)} km`}
                                              tooltip="Distância média percorrida entre dois abastecimentos consecutivos no período." 
                                           />
                                           <FuelStatRow 
                                              label="Média dias entre abastecimentos" 
                                              value={`${formatDecimal(fStat.avgDaysBetweenPeriod)} dias`}
                                              tooltip="Tempo médio em dias decorrido entre dois abastecimentos consecutivos no período." 
                                           />
                                        </div>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                   )}
                </div>
             </div>
          </div>

          {/* ROW 3: MONTHLY ANALYSIS (GROUPED) */}
          <div className="row mb-4">
             <div className="col-12">
               <div className="card border-0 shadow-sm h-100">
                  <div 
                     className="card-body p-3 p-md-4 d-flex align-items-center justify-content-between cursor-pointer"
                     onClick={() => setShowMonthlyAnalysis(!showMonthlyAnalysis)}
                  >
                     <div className="d-flex align-items-center">
                        <div className="d-flex align-items-center justify-content-center">
                            <CalendarRange className="text-info me-2" size={24} />
                        </div>
                        <h5 className="fw-bold mb-0">Análise Mensal</h5>
                        <div className="ms-2 hint--top hint--rounded hint--medium d-flex align-items-center" aria-label="Análise detalhada de gastos e frequência mês a mês.">
                            <CircleHelp size={16} className="text-muted opacity-50 cursor-help" />
                        </div>
                     </div>
                     <div className="text-muted">
                        {showMonthlyAnalysis ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                     </div>
                  </div>
                  
                  {showMonthlyAnalysis && (
                     <div className="card-body p-3 p-md-4 pt-0 border-top-0 animate-fade-in">
                         {/* JUST ONE FULL WIDTH CHART NOW */}
                         <h6 className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center">
                             <Banknote size={16} className="me-2 text-primary" /> Gasto Mensal
                         </h6>
                         <BarChart data={stats.monthlyExpenseChart} color="bg-primary" loading={isFiltering} />
                     </div>
                  )}
               </div>
             </div>
          </div>

           {/* ROW 4: OPERATIONAL (GROUPED) */}
           <div className="row mb-4">
             <div className="col-12">
                <div className="card border-0 shadow-sm h-100">
                   <div 
                      className="card-body p-3 p-md-4 d-flex align-items-center justify-content-between cursor-pointer"
                      onClick={() => setShowOperationalStats(!showOperationalStats)}
                   >
                      <div className="d-flex align-items-center">
                         <div className="d-flex align-items-center justify-content-center">
                             <CreditCard className="text-secondary me-2" size={24} />
                         </div>
                         <h5 className="fw-bold mb-0">Operacional</h5>
                         <div className="ms-2 hint--top hint--rounded hint--medium d-flex align-items-center" aria-label="Detalhes sobre formas de pagamento e uso de aplicativos.">
                            <CircleHelp size={16} className="text-muted opacity-50 cursor-help" />
                         </div>
                      </div>
                      <div className="text-muted">
                         {showOperationalStats ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                   </div>
                   
                   {showOperationalStats && (
                      <div className="card-body p-3 p-md-4 pt-0 border-top-0 animate-fade-in">
                         <div className="row g-4">
                            {/* Payment Methods */}
                            <div className="col-lg-6">
                               <h6 className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center">
                                  <DollarSign size={16} className="me-2" /> Formas de Pagamento
                               </h6>
                               <BarChart 
                                  data={stats.paymentStatsArray.map((item: { method: string; total: number; count: number }) => ({
                                    label: item.method,
                                    value: item.total,
                                    displayValue: formatCurrency(item.total),
                                    badge: `${item.count} ${item.count === 1 ? 'vez' : 'vezes'}`
                                  }))}
                                  color="bg-secondary"
                                  loading={isFiltering} 
                               />
                            </div>

                            {/* Mobile Separator */}
                            <div className="d-lg-none"><hr className="my-0 text-muted opacity-25"/></div>

                            {/* Apps Used */}
                            <div className="col-lg-6">
                               <h6 className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center">
                                  <Smartphone size={16} className="me-2 text-primary" /> Apps Utilizados
                               </h6>
                               {isFiltering ? <ChartSkeleton /> : (
                                  stats.appStatsArray.length > 0 ? (
                                      <div className="d-flex flex-column gap-2">
                                         {stats.appStatsArray.map((item: { app: string; count: number; total: number }, idx) => (
                                            <div key={idx} className="d-flex align-items-center justify-content-between small">
                                               <span>{String(item.app)}</span>
                                               <span className="badge bg-secondary bg-opacity-10 text-secondary">{item.count} vezes</span>
                                            </div>
                                         ))}
                                      </div>
                                  ) : (
                                     <p className="text-muted small mb-0">Nenhum aplicativo registrado no período.</p>
                                  )
                               )}
                            </div>
                         </div>
                      </div>
                   )}
                </div>
             </div>
           </div>

        </>
      )}

      {/* Configuration Modal */}
      {isConfigModalOpen && (
         <>
           <div className="modal fade show d-block" tabIndex={-1} style={{zIndex: 1060}}>
             <div className="modal-dialog modal-dialog-centered">
               <div className="modal-content border-0 shadow-lg">
                 <div className="modal-header bg-body-secondary">
                   <h5 className="modal-title fw-bold d-flex align-items-center">
                      <Settings size={20} className="me-2 text-primary" />
                      Configurar Estatísticas
                   </h5>
                   <button type="button" className="btn-close" onClick={() => setIsConfigModalOpen(false)}></button>
                 </div>
                 <div className="modal-body p-0">
                   <div className="p-3 text-muted small bg-light border-bottom">
                     Reorganize a ordem de exibição das métricas rápidas utilizando as setas.
                   </div>
                   <ul className="list-group list-group-flush" style={{maxHeight: '50vh', overflowY: 'auto'}}>
                     {metricOrder.map((metricId, index) => {
                       const def = METRIC_DEFINITIONS[metricId];
                       if (!def) return null;
                       return (
                         <li key={metricId} className="list-group-item d-flex align-items-center justify-content-between py-2 py-md-3">
                           <div className="d-flex align-items-center">
                              <GripVertical size={18} className="text-muted me-3 opacity-50" />
                              <span className="fw-medium">{def.label}</span>
                           </div>
                           <div className="btn-group">
                             <button 
                               type="button" 
                               className="btn btn-sm btn-outline-secondary"
                               onClick={() => moveMetric(index, 'up')}
                               disabled={index === 0}
                             >
                               <ArrowUp size={16} />
                             </button>
                             <button 
                               type="button" 
                               className="btn btn-sm btn-outline-secondary"
                               onClick={() => moveMetric(index, 'down')}
                               disabled={index === metricOrder.length - 1}
                             >
                               <ArrowDown size={16} />
                             </button>
                           </div>
                         </li>
                       );
                     })}
                   </ul>
                 </div>
                 <div className="modal-footer bg-body-secondary">
                   <button type="button" className="btn btn-primary d-flex align-items-center" onClick={() => setIsConfigModalOpen(false)}>
                     <Check size={18} className="me-2" />
                     Concluir
                   </button>
                 </div>
               </div>
             </div>
           </div>
           <div className="modal-backdrop fade show" style={{zIndex: 1055}}></div>
         </>
      )}
    </div>
  );
};

export default Dashboard;