import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renderiza sin romperse', () => {
    render(<App />);
    expect(
      screen.getByRole('button', { name: /count is/i }),
    ).toBeInTheDocument();
  });
});
