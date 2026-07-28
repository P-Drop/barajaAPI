import { render, screen } from '@testing-library/react';
import { AchievementBadge } from './AchievementBadge';

describe('AchievementBadge', () => {
  it('muestra imagen y nombre del logro conocido', async () => {
    render(<AchievementBadge id="ESCALERA_MECANICA" />);
    expect(
      screen.getByRole('img', { name: 'Escalera mecánica' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Escalera mecánica');
  });

  it('logro desconocido -> fallback de texto', async () => {
    render(<AchievementBadge id="NO_EXISTE" />);
    expect(screen.getByText('NO_EXISTE')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
