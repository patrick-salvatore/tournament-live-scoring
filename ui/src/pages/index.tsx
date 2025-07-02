import { createForm, useField, Form as _Form } from "@gapu/formix";
import { useMutation } from "@tanstack/solid-query";
import { ErrorBoundary } from "solid-js";
import { z } from "zod";

import { assignTeam } from "~/api/teams";

import { LoadingButton } from "~/components/loading_button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { FieldError, FormError } from "~/components/ui/form";
import { TextField, TextFieldRoot } from "~/components/ui/textfield";
import authStore from "~/lib/auth";

const TeamUuidField = () => {
  const field = useField<string>("teamId");

  return (
    <TextFieldRoot class="space-y-1">
      <TextField
        value={field.value() as string}
        placeholder="Team Code"
        onInput={(e) => field.setValue(e.currentTarget.value)}
        onFocus={() => {
          field.setMeta((prev) => ({ ...prev, touched: true }));
        }}
        disabled={field.meta().disabled}
        required
      />
      <FieldError name={"teamId"} />
    </TextFieldRoot>
  );
};

const TeamForm = () => {
  const form = createForm({
    schema: z.object({
      teamId: z.string(),
    }),
    initialState: {
      teamId: "",
      error: null,
    },
    onSubmit: async (state) => {
      Object.keys(state).forEach((key) => {
        form.setFieldMeta(key, (prev) => ({
          ...prev,
          error: null,
        }));
      });
      mutation.mutate({ teamId: state.teamId });
    },
  });

  const mutation = useMutation<string, any, { teamId: string }>(() => ({
    mutationFn: ({ teamId }) => assignTeam(teamId.toLowerCase()),
    onError: (error: any) => {
      form.setState("error", () => error.response.data.message);
    },
    onSuccess: (data) => {
      authStore.save(data);
    },
  }));

  return (
    <Card class="pt-4">
      <_Form context={form}>
        <CardContent class="p-4 space-y-2">
          <TeamUuidField />
        </CardContent>
        <CardFooter>
          <LoadingButton isLoading={() => mutation.isPending} type="submit">
            Submit
          </LoadingButton>
        </CardFooter>
        <FormError />
      </_Form>
    </Card>
  );
};

export default function Home() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <p>Something went wrong: {error.message}</p>
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    >
      <TeamForm />
    </ErrorBoundary>
  );
}
