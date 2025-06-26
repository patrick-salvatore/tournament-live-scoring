import { createForm, useField, Form as _Form } from "@gapu/formix";
import { z } from "zod";
import { createSignal } from "solid-js";

const UuidField = () => {
  const field = useField<string>("uuid");

  return (
    <input
      value={field.value() || ""}
      placeholder="uuid"
      onInput={(e) => field.setValue(e.currentTarget.value)}
      onFocus={() => field.setMeta((prev: any) => ({ ...prev, touched: true }))}
      disabled={field.meta().disabled}
    />
  );
};

const Form = () => {
  const formContext = createForm({
    schema: z.object({
      uuid: z.string(),
    }),
    initialState: {},
    onSubmit: async (state: any) => {
      console.log("Form submitted:", state);
    },
  });

  return (
    <_Form context={formContext}>
      <UuidField />
      <button type="submit">Submit</button>
    </_Form>
  );
};

export default function Home() {
  const [count, setCount] = createSignal(0);
  // const query = useQuery(() => ({
  //   queryKey: ["tournaments"],
  //   queryFn: getTournaments,
  // }));

  return <Form />;
}
