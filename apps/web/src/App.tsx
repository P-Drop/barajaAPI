import { Deck } from './components/Deck';

function App() {
  return (
    <div className="min-h-screen bg-tapete text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 rounded-lg bg-[url('/textures/wood_background.webp')] bg-repeat py-6 text-center shadow-lg">
          <h1 className="font-display text-3xl font-bold [text-shadow:_0_2px_4px_rgb(0_0_0/0.6)]">
            LA BARAJA ESPAÑOLA
          </h1>
        </header>
        <main>
          <Deck />
        </main>
        <footer className="mt-8 text-center text-sm text-pretty text-green-200 sm:text-right">
          <p>
            Cartas:{' '}
            <a
              href="https://commons.wikimedia.org/wiki/File:Baraja_espa%C3%B1ola_completa.png"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-white"
            >
              «Baraja española completa»
            </a>{' '}
            por Basquetteur, bajo{' '}
            <a
              href="https://creativecommons.org/licenses/by-sa/3.0/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-white"
            >
              CC BY-SA 3.0
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
