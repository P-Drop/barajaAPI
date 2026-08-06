import { render, screen, act } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('muestra el mensaje y se auto-descarta tras la duración', async () => {
    const onDismiss = vi.fn();
    render(<Toast message="Logro" onDismiss={onDismiss} duration={1000} />);

    expect(screen.getByRole('status')).toHaveTextContent('Logro');
    expect(onDismiss).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('usa la duración por defecto sin romper', () => {
    render(<Toast message="x" onDismiss={() => {}} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
