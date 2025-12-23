import type { ReactNode } from "react";
import type {
  FieldValues,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import { FormProvider } from "react-hook-form";

interface HookFormProps<T extends FieldValues> {
  methods: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: ReactNode;
  className?: string;
  formId?: string;
}

export function HookForm<T extends FieldValues>({
  methods,
  onSubmit,
  children,
  className,
  formId,
}: HookFormProps<T>) {
  return (
    <FormProvider {...methods}>
      <form
        className={className}
        id={formId}
        onSubmit={methods.handleSubmit(onSubmit)}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  );
}
