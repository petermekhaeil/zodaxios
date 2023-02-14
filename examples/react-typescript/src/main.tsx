import * as React from 'react';
import ReactDOM from 'react-dom/client';
import zodaxios from '../../../src/index';
import { useEffect, useState } from 'react';
import { z } from 'zod';

const PokemonSchema = z.object({
  name: z.string(),
  sprites: z.object({
    front_default: z.string().url()
  })
});

type Pokemon = z.infer<typeof PokemonSchema>;

function App() {
  const [pokemonName] = useState('ditto');
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);

  // Note that if you use a framework, using your framework’s data fetching
  // mechanism will be a lot more efficient than writing Effects manually.
  // https://beta.reactjs.org/reference/react/useEffect#fetching-data-with-effects
  useEffect(() => {
    let ignore = false;

    setPokemon(null);

    zodaxios
      .get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`, {
        schema: PokemonSchema
      })
      .then(({ data }) => {
        if (!ignore) {
          setPokemon(data);
        }
      });

    return () => {
      ignore = true;
    };
  }, [pokemonName]);

  return (
    <>
      <h1>{pokemon?.name}</h1>
      <img src={pokemon?.sprites.front_default} />
    </>
  );
}

const rootElement = document.getElementById('root') as HTMLElement;
ReactDOM.createRoot(rootElement).render(<App />);
