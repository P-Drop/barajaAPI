import { render, screen } from '@testing-library/react';
import { Board } from './Board';
import type { PlayerView } from '../api/client';

const sampleView: PlayerView = {
  schemaVersion: 1,
  cross: [['OROS-5'], [], ['COPAS-12'], ['ESPADAS-9', 'BASTOS-8'], []],
  corners: {
    OROS: 3,
    COPAS: 8,
    ESPADAS: 0,
    BASTOS: 1,
  },
  stock: { count: 28 },
  discard: ['OROS-10', 'BASTOS-5'],
  hand: 'ESPADAS-1',
  round: 17,
  starsAvailable: 0,
  starsUsed: 2,
  moveCount: 44,
  status: 'IN_PROGRESS',
  extra: ['ESPADAS-12', null],
  stairwayUnlocked: false,
  stairwayBuilding: null,
};

describe('Board', () => {
  it('pinta la carta superior de cruz, esquinas, descarte y mano', () => {
    render(<Board view={sampleView} />);
    expect(screen.getByRole('img', { name: '3 de oros' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '5 de oros' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '8 de copas' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Rey de copas' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '8 de bastos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'As de bastos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '5 de bastos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'As de espadas' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Rey de espadas' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Sota de oros' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });
});

import userEvent from '@testing-library/user-event';

describe('Board interacciones', () => {
  it('onSelect recibe la posición de la celda pulsada', async () => {
    const onSelect = vi.fn();
    render(<Board view={sampleView} onSelect={onSelect} />);
    // "5 de oros" es el tope de cross[0]
    await userEvent.click(screen.getByRole('img', { name: '5 de oros' }));
    expect(onSelect).toHaveBeenCalledWith({ zone: 'cross', index: 0 });
  });

  it('onDraw se dispara al pulsar el mazo', async () => {
    const onDraw = vi.fn();
    render(<Board view={sampleView} onDraw={onDraw} />);
    await userEvent.click(screen.getByRole('button', { name: '28' }));
    expect(onDraw).toHaveBeenCalledOnce();
  });

  it('la pastilla despliega la pila (onExpand) con su posición', async () => {
    const onExpand = vi.fn();
    const view = {
      ...sampleView,
      discard: ['OROS-12', 'BASTOS-2', 'ESPADAS-7'],
    };
    render(<Board view={view} onExpand={onExpand} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ver 3 cartas' }));
    expect(onExpand).toHaveBeenCalledWith({ zone: 'discard' });
  });

  it('no muestra pastilla en pilas con menos de 2 cartas', () => {
    render(<Board view={sampleView} onExpand={vi.fn()} />);
    // cross[0] = ['OROS-5'] (1 carta) -> sin pastilla
    expect(screen.queryByRole('button', { name: 'Ver 1 cartas' })).toBeNull();
  });

  it.each([
    { zone: 'corner', suit: 'OROS' } as const,
    { zone: 'extra', index: 0 } as const,
    { zone: 'discard' } as const,
  ])('resalta la celda seleccionada %o', (selected) => {
    render(
      <Board
        view={{ ...sampleView, extra: ['OROS-8', null] }}
        onSelect={() => {}}
        selected={selected}
      />,
    );
    expect(screen.getByRole('img', { name: '8 de oros' })).toBeInTheDocument();
  });
});
