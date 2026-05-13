import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: () => <div data-testid="ref-line" />,
  FunnelChart: ({ children }: any) => <div data-testid="funnel-chart">{children}</div>,
  Funnel: ({ children }: any) => <div data-testid="funnel">{children}</div>,
  LabelList: () => <div data-testid="label-list" />,
  RadialBarChart: ({ children }: any) => <div data-testid="radial-bar-chart">{children}</div>,
  RadialBar: () => <div data-testid="radial-bar" />,
  PolarAngleAxis: () => <div data-testid="polar-angle" />,
}));

import { AreaChartComponent } from './AreaChart';
import { BarChartComponent } from './BarChart';
import { LineChartComponent } from './LineChart';
import { PieChartComponent } from './PieChart';
import { FunnelChartComponent } from './FunnelChart';
import { GaugeChartComponent } from './GaugeChart';
import { SparklineChart } from './SparklineChart';
import { WaterfallChartComponent } from './WaterfallChart';
import { ChartContainer } from './ChartContainer';

describe('AreaChartComponent', () => {
  describe('Given no data', () => {
    it('When data is empty / Then shows no data message', () => {
      render(<AreaChartComponent data={[]} xAxisKey="date" yAxisKey="value" />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Given data exists', () => {
    it('When rendered / Then renders chart', () => {
      render(<AreaChartComponent data={[{ date: '2024-01', value: 100 }]} xAxisKey="date" yAxisKey="value" />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('When targetLine provided / Then renders with reference', () => {
      render(<AreaChartComponent data={[{ date: '2024-01', value: 100 }]} xAxisKey="date" yAxisKey="value" targetLine={{ value: 80, label: 'Target' }} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });
});

describe('BarChartComponent', () => {
  describe('Given no data', () => {
    it('When empty / Then shows no data', () => {
      render(<BarChartComponent data={[]} xAxisKey="cat" series={[{ key: 'val', name: 'Value' }]} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Given data', () => {
    it('When rendered / Then shows chart', () => {
      render(<BarChartComponent data={[{ cat: 'A', val: 10 }]} xAxisKey="cat" series={[{ key: 'val', name: 'Value' }]} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });
});

describe('LineChartComponent', () => {
  describe('Given no data', () => {
    it('When empty / Then shows no data', () => {
      render(<LineChartComponent data={[]} xAxisKey="x" series={[{ key: 'y', name: 'Y' }]} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Given data', () => {
    it('When rendered / Then shows chart', () => {
      render(<LineChartComponent data={[{ x: '1', y: 10 }]} xAxisKey="x" series={[{ key: 'y', name: 'Y' }]} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });
});

describe('PieChartComponent', () => {
  describe('Given no data', () => {
    it('When empty / Then shows no data', () => {
      render(<PieChartComponent data={[]} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Given data', () => {
    it('When rendered / Then shows chart', () => {
      render(<PieChartComponent data={[{ name: 'A', value: 60 }, { name: 'B', value: 40 }]} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('When custom colors provided / Then renders without error', () => {
      render(<PieChartComponent data={[{ name: 'A', value: 60 }]} colors={['#ff0000']} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });
});

describe('FunnelChartComponent', () => {
  describe('Given no data', () => {
    it('When empty / Then shows no data', () => {
      render(<FunnelChartComponent data={[]} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Given data', () => {
    it('When rendered / Then shows funnel stages', () => {
      render(<FunnelChartComponent data={[{ name: 'Lead', value: 100 }, { name: 'Qualified', value: 60 }]} />);
      expect(screen.getByText('Lead')).toBeInTheDocument();
      expect(screen.getByText('Qualified')).toBeInTheDocument();
    });
  });
});

describe('GaugeChartComponent', () => {
  describe('Given a value', () => {
    it('When rendered / Then shows gauge with percentage', () => {
      const { container } = render(<GaugeChartComponent value={75} title="Completion" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Completion')).toBeInTheDocument();
    });
  });
});

describe('SparklineChart', () => {
  describe('Given data points', () => {
    it('When rendered / Then renders SVG', () => {
      const { container } = render(
        <SparklineChart data={[{ date: '2024-01-01', value: 10 }, { date: '2024-01-02', value: 20 }]} />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Given empty data', () => {
    it('When no data / Then renders placeholder div', () => {
      const { container } = render(<SparklineChart data={[]} />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });
});

describe('WaterfallChartComponent', () => {
  describe('Given no data', () => {
    it('When empty / Then shows no data', () => {
      render(<WaterfallChartComponent data={[]} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Given data', () => {
    it('When rendered / Then shows chart', () => {
      render(<WaterfallChartComponent data={[{ name: 'Revenue', value: 1000 }, { name: 'Costs', value: -400 }]} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });
});

describe('ChartContainer', () => {
  describe('Given children', () => {
    it('When rendered / Then wraps children with title', () => {
      render(<ChartContainer title="Sales"><div>chart</div></ChartContainer>);
      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.getByText('chart')).toBeInTheDocument();
    });
  });
});
