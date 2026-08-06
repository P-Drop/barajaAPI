import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarPanel } from './StarPanel';

const noop = () => {};

describe('StarPanel', () => {
  it('con estrellas, mano libre y descarte: ambos poderes usables', async () => {
    const onExtraSlot = vi.fn();
    const onRecover = vi.fn();
    const user = userEvent.setup();
    render(
      <StarPanel
        available={2}
        canUse
        hasDiscard
        onExtraSlot={onExtraSlot}
        onRecover={onRecover}
      />,
    );
    expect(
      screen.getByLabelText('2 estrellas disponibles'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Espacio extra' }));
    await user.click(
      screen.getByRole('button', { name: 'Recuperar del descarte' }),
    );
    expect(onExtraSlot).toHaveBeenCalledOnce();
    expect(onRecover).toHaveBeenCalledOnce();
  });

  it('sin estrellas: ambos deshabilitados', () => {
    render(
      <StarPanel
        available={0}
        canUse
        hasDiscard
        onExtraSlot={noop}
        onRecover={noop}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Espacio extra' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Recuperar del descarte' }),
    ).toBeDisabled();
  });

  it('mano ocupada o descarte vacío deshabilitan lo que toca', () => {
    render(
      <StarPanel
        available={2}
        canUse={false}
        hasDiscard={false}
        onExtraSlot={noop}
        onRecover={noop}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Espacio extra' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Recuperar del descarte' }),
    ).toBeDisabled();
  });
});
