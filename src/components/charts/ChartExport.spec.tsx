import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChartExport } from './ChartExport';

describe('ChartExport', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given the export button is rendered', () => {
    it('When displayed / Then shows the download button', () => {
      render(<ChartExport chartId="c1" chartTitle="Revenue" data={[]} />);
      expect(screen.getByTitle('Export chart')).toBeInTheDocument();
    });
  });

  describe('Given the export button is clicked', () => {
    it('When clicked / Then shows PNG and CSV export options', async () => {
      render(<ChartExport chartId="c1" chartTitle="Revenue" data={[{ value: 1 }]} />);
      await userEvent.click(screen.getByTitle('Export chart'));
      expect(screen.getByText('Export as PNG')).toBeInTheDocument();
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
    });
  });

  describe('Given custom export handlers', () => {
    it('When CSV export clicked with onExportCSV / Then calls the handler', async () => {
      const onExportCSV = vi.fn();
      render(<ChartExport chartId="c1" chartTitle="Revenue" data={[]} onExportCSV={onExportCSV} />);
      await userEvent.click(screen.getByTitle('Export chart'));
      await userEvent.click(screen.getByText('Export as CSV'));
      expect(onExportCSV).toHaveBeenCalled();
    });

    it('When PNG export clicked with onExportPNG / Then calls the handler', async () => {
      const onExportPNG = vi.fn();
      render(<ChartExport chartId="c1" chartTitle="Revenue" data={[]} onExportPNG={onExportPNG} />);
      await userEvent.click(screen.getByTitle('Export chart'));
      await userEvent.click(screen.getByText('Export as PNG'));
      expect(onExportPNG).toHaveBeenCalled();
    });
  });

  describe('Given the menu is open', () => {
    it('When backdrop clicked / Then closes the menu', async () => {
      render(<ChartExport chartId="c1" chartTitle="Revenue" data={[]} />);
      await userEvent.click(screen.getByTitle('Export chart'));
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
      await userEvent.click(backdrop);
      expect(screen.queryByText('Export as CSV')).not.toBeInTheDocument();
    });
  });
});
