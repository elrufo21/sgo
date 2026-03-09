import type {
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  SelectHTMLAttributes,
} from "react";
import type { FieldValues, Path, RegisterOptions } from "react-hook-form";
import { useFormContext, Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";
import {
  focusNextInput,
  focusPreviousInput,
} from "@/shared/helpers/focusNextInput";

type OptionValue = string | number;

interface HookFormSelectProps<T extends FieldValues> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "name"
> {
  name: Path<T>;
  label: string;
  options: { value: OptionValue; label: string }[];
  rules?: RegisterOptions<T>;
  helperText?: string;
}

export function HookFormSelect<T extends FieldValues>({
  name,
  label,
  options,
  rules,
  helperText,
  className,
  onKeyDown,
  onChange,
  onBlur,
  disabled,
  autoComplete,
  ...rest
}: HookFormSelectProps<T>) {
  const {
    control,
    formState: { isSubmitting },
  } = useFormContext<T>();
  const resolvedAutoComplete = autoComplete ?? "new-password";

  return (
    <div className="mt-3">
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field, fieldState }) => {
          const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
            onKeyDown?.(event as unknown as KeyboardEvent<HTMLSelectElement>);
            if (event.defaultPrevented) return;
            const source = event.target as HTMLElement;

            if (event.key === "ArrowUp") {
              event.preventDefault();
              focusPreviousInput(source);
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              focusNextInput(source);
              return;
            }

            if (event.key === "ArrowLeft") {
              event.preventDefault();
              focusPreviousInput(source);
              return;
            }

            if (event.key === "ArrowRight") {
              event.preventDefault();
              focusNextInput(source);
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              const moved = focusNextInput(source);
              if (!moved) {
                event.currentTarget.form?.requestSubmit();
              }
            }
          };

          const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
            field.onChange(event.target.value);
            onChange?.(event as unknown as ChangeEvent<HTMLSelectElement>);
            const source = event.target as HTMLElement;
            const moved = focusNextInput(source);
            if (moved) return;

            const active = source.ownerDocument?.activeElement ?? document.activeElement;
            if (active instanceof HTMLElement) {
              focusNextInput(active);
            }
          };

          const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
            field.onBlur();
            onBlur?.(event as unknown as FocusEvent<HTMLSelectElement>);
          };

          return (
            <TextField
              fullWidth
              select
              variant="outlined"
              size="small"
              label={label}
              SelectProps={{ native: true }}
              value={field.value ?? ""}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              onBlur={handleBlur}
              inputRef={field.ref}
              name={field.name}
              autoComplete={resolvedAutoComplete}
              error={!!fieldState.error}
              disabled={disabled || isSubmitting}
              helperText={fieldState.error?.message ?? helperText}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "0.45rem",
                  backgroundColor: "#fff",
                  "& fieldset": {
                    borderWidth: "1px",
                    borderColor: "#e5e7eb",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                    boxShadow: "0 0 0 2px rgba(59,130,246,0.25)",
                  },
                },
                "& .MuiInputBase-input": {
                  fontSize: "0.875rem",
                  py: 1,
                },
              }}
              inputProps={
                {
                  ...rest,
                  className,
                  "data-auto-next": "true",
                  "aria-invalid": fieldState.error ? "true" : "false",
                  autoComplete: resolvedAutoComplete,
                } as Record<string, unknown>
              }
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextField>
          );
        }}
      />
    </div>
  );
}
