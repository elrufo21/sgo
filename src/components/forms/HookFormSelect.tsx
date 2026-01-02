import type { KeyboardEvent, SelectHTMLAttributes } from "react";
import type { FieldValues, Path, RegisterOptions } from "react-hook-form";
import { useFormContext, Controller } from "react-hook-form";
import { focusNextInput } from "@/shared/helpers/focusNextInput";

type OptionValue = string | number;

interface HookFormSelectProps<T extends FieldValues>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "name"> {
  name: Path<T>;
  label: string;
  options: { value: OptionValue; label: string }[];
  rules?: RegisterOptions<T>;
}

export function HookFormSelect<T extends FieldValues>({
  name,
  label,
  options,
  rules,
  className,
  onKeyDown,
  onChange,
  ...rest
}: HookFormSelectProps<T>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => {
        const handleKeyDown = (event: KeyboardEvent<HTMLSelectElement>) => {
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

        const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
          field.onChange(event.target.value);
          onChange?.(event);
          focusNextInput(event.currentTarget);
        };

        return (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {label}
            </label>
            <select
              data-auto-next="true"
              className={
                className ??
                "w-full px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
              }
              aria-invalid={fieldState.error ? "true" : "false"}
              value={field.value ?? ""}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              ref={field.ref}
              onBlur={field.onBlur}
              name={field.name}
              {...rest}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldState.error && (
              <p className="text-sm text-red-600">
                {String(fieldState.error.message ?? "Este campo es requerido")}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
