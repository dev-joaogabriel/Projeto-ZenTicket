import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResponsiveSelect from './responsive-select';

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

describe('ResponsiveSelect (desktop)', () => {
  it('renders Radix Select with options', () => {
    render(
      <ResponsiveSelect
        value={undefined}
        onChange={() => { }}
        placeholder="Status"
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ]}
      />
    );
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});

// Mobile variation: ensure drawer variant displays custom trigger label when isMobile mocked
describe('ResponsiveSelect (mobile)', () => {
  it('renders mobile trigger (still button/combobox) with placeholder text', async () => {
    vi.doMock('@/hooks/use-mobile', () => ({ useIsMobile: () => true }));
    const { default: MobileResponsiveSelect } = await import('./responsive-select');
    render(
      <MobileResponsiveSelect
        value={undefined}
        onChange={() => { }}
        placeholder="Prioridade"
        options={[{ value: 'alta', label: 'Alta' }]}
      />
    );
    // Drawer trigger presents as a normal button element
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Prioridade');
  });
});