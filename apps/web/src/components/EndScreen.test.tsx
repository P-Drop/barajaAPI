import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EndScreen } from './EndScreen';

type Props = Parameters<typeof EndScreen>[0];

const renderEnd = (over: Partial<Props> = {}) =>
  render(
    <MemoryRouter>
      <EndScreen
        status="WON"
        stars={2}
        durationSeconds={125}
        jokersUsed={1}
        onRestart={() => {}}
        {...over}
      />
    </MemoryRouter>,
  );

describe('EndScreen', () => {
  it('victoria: estrellas, tiempo y comodines', () => {
    renderEnd();
    expect(screen.getByText('¡Victoria!')).toBeInTheDocument();
    expect(screen.getByLabelText('2 estrellas')).toBeInTheDocument();
    expect(screen.getByText('Tiempo: 2:05')).toBeInTheDocument();
    expect(screen.getByText('Comodines usados: 1')).toBeInTheDocument();
  });

  it('estrellas = 0 -> se muestra solo texto', () => {
    renderEnd({ stars: 0 });
    expect(screen.getByText('Sin estrellas')).toBeInTheDocument();
  });

  it.each([
    ['LOST', 'Derrota'],
    ['ABANDONED', 'Partida abandonada'],
  ] as const)('%s muestra "%s" y sin estrellas', (status, title) => {
    renderEnd({ status, stars: 0 });
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.queryByLabelText(/estrellas/)).toBeNull();
  });

  it('"Jugar otra vez" llama a onRestart', async () => {
    const onRestart = vi.fn();
    const user = userEvent.setup();
    renderEnd({ onRestart });
    await user.click(screen.getByRole('button', { name: /jugar otra vez/i }));
    expect(onRestart).toHaveBeenCalledOnce();
  });
});
