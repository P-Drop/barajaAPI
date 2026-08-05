import { render, screen, act } from '@testing-library/react';
import { Countdown } from './Countdown';

describe('Countdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('cuenta 3-2-1, muestra "Suerte" y avisa una sola vez al terminar', async () => {
    const onDone = vi.fn();
    render(<Countdown onDone={onDone} />);

    expect(screen.getByText('3')).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByText('2')).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByText('1')).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByText('¡Suerte!')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled(); // aún en la pausa de "Suerte"

    await act(() => vi.advanceTimersByTimeAsync(800));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
