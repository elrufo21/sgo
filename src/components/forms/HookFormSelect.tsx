import type { SelectHTMLAttributes } from "react";
import type {
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";
import { useFormContext } from "react-hook-form";

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
  ...rest
}: HookFormSelectProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <select
        className={
          className ??
          "w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
        }
        aria-invalid={error ? "true" : "false"}
        {...register(name, rules)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">
          {String(error.message ?? "Este campo es requerido")}
        </p>
      )}
    </div>
  );
}

