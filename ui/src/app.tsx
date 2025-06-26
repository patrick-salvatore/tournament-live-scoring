import { Suspense } from "solid-js";

const App = (props: any) => {
  return (
    <main>
      <Suspense>{props.children}</Suspense>
    </main>
  );
};

export default App;
