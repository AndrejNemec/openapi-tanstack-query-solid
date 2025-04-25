import { For, Show, Suspense } from 'solid-js';
import './App.css';
import {
  useCreatePets,
  useListPets,
} from './api/endpoints/petstoreFromFileSpecWithTransformer';

function App() {
  const pets = useListPets(() => ({}));

  const createPet = useCreatePets();

  const onSubmit = () => {
    createPet.mutate({
      data: {
        name: 'Hello pet',
        tag: 'Hello',
      },
    });
  };

  return (
    <div>
      <Suspense fallback="Loading...">
        <For each={pets.data}>{(pet) => <div>{pet.name}</div>}</For>
      </Suspense>

      <br />
      <br />

      <Show when={createPet.isSuccess}>
        Created pet: {createPet.data?.name}
      </Show>

      <br />
      <br />

      <button onClick={onSubmit}>Create pet</button>
    </div>
  );
}

export default App;
