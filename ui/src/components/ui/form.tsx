import { useField, Form as FormProvider, useForm } from "@gapu/formix";

import { type JSX, For, Show, type ParentProps } from "solid-js";
import { cn } from "~/lib/cn";
import { TextFieldLabel } from "./textfield";

const Form = FormProvider;

type FormItemProps = ParentProps<JSX.HTMLAttributes<HTMLDivElement>>;

const CircleAlertIcon = ({ width, height }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke="currentColor"
      stroke-width="2"
      class="lucide lucide-icon lucide-circle-alert"
      width={width || "16"}
      height={height || "16"}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" x2="12" y1="8" y2="12"></line>
      <line x1="12" x2="12.01" y1="16" y2="16"></line>
    </svg>
  );
};

const FormItem = ({ class: _class, ...props }: FormItemProps) => {
  return <div class={cn("space-y-2", _class)} {...props} />;
};
FormItem.displayName = "FormItem";

const FormLabel = ({
  name,
  class: _class,
  ...props
}: {
  class: string;
  name: string;
}) => {
  const { errors } = useField<string>(name);

  return (
    <div class="space-y-1">
      <TextFieldLabel
        class={cn(errors() && "text-destructive", _class)}
        for={name}
        {...props}
      />
    </div>
  );
};
FormLabel.displayName = "FormLabel";

type FormErrorProps = ParentProps<JSX.HTMLAttributes<HTMLParagraphElement>>;

const FormError = ({ class: _class, ...props }: FormErrorProps) => {
  const { state } = useForm();

  const getMessage = () => {
    const error = (state() as any).error;

    if (typeof error === "string") {
      return error;
    } else if (error instanceof Error) {
      return error.message;
    }

    return null;
  };

  return (
    <Show when={(state() as any).error}>
      <p
        class={cn(
          "w-full flex gap-2 justify-center text-destructive bg-destructive/10 p-2 rounded-md text-center",
          "text-xs font-normal",
          _class
        )}
        {...props}
      >
        <CircleAlertIcon width={16} height={16} />
        <span>{getMessage()}</span>
      </p>
    </Show>
  );
};
FormError.displayName = "FormFieldError";

type FieldErrorProps = ParentProps<JSX.HTMLAttributes<HTMLParagraphElement>> & {
  name: string;
};

const FieldError = ({ name, class: _class, ...props }: FieldErrorProps) => {
  const field = useField(name);

  return (
    <Show when={(field.meta() as any).error}>
      <p
        class={cn(
          "gap-1 flex text-destructive bg-destructive/10 p-2 rounded-md text-center",
          "text-xs font-normal",
          _class
        )}
        {...props}
      >
        <CircleAlertIcon width={16} height={16} />
        <span>{(field.meta() as any).error}</span>
      </p>
    </Show>
  );
};
FieldError.displayName = "FormFieldError";

export { Form, FormItem, FormLabel, FormError, FieldError };
