import type { InputHTMLAttributes, KeyboardEvent } from "react";
import type { FieldValues, Path, RegisterOptions } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { focusNextInput } from "@/shared/helpers/focusNextInput";

type HookFormInputProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  rules?: RegisterOptions<T>;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name">;

export function HookFormInput<T extends FieldValues>({
  name,
  label,
  rules,
  className,
  onKeyDown,
  type = "text",
  ...rest
}: HookFormInputProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === "Enter") {
      event.preventDefault();
      const moved = focusNextInput(event.currentTarget);
      if (!moved) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        data-auto-next="true"
        className={
          className ??
          "w-full px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm h-[50px]"
        }
        aria-invalid={error ? "true" : "false"}
        type={type}
        onKeyDown={handleKeyDown}
        {...register(name, rules)}
        {...rest}
      />
      {error && (
        <p className="text-sm text-red-600">
          {String(error.message ?? "Este campo es requerido")}
        </p>
      )}
    </div>
  );
}
