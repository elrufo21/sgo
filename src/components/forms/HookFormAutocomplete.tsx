import type {
  FieldValues,
  Path,
  RegisterOptions,
  Control,
} from "react-hook-form";
import { useFormContext, Controller } from "react-hook-form";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { Pencil } from "lucide-react";
import type { KeyboardEvent } from "react";
import { focusNextInput } from "@/shared/helpers/focusNextInput";

type BaseOption = {
  label: string;
  value: string | number;
} & Record<string, any>;

interface HookFormAutocompleteProps<
  T extends FieldValues,
  TOption extends BaseOption = BaseOption
> {
  name: Path<T>;
  label: string;
  options: TOption[];
  rules?: RegisterOptions<T>;
  placeholder?: string;
  getOptionLabel?: (option: TOption) => string;
  isOptionEqualToValue?: (option: TOption, value: TOption) => boolean;
  onOptionSelected?: (option: TOption | null) => void;
  disableClearable?: boolean;
  className?: string;
  control?: Control<T>;

  allowCreate?: boolean;
  createLabel?: (value: string) => string;
  onCreateOption?: (value: string) => void;

  onOpenModal?: (option: TOption) => void;
  modalIcon?: React.ReactNode;
  modalTitle?: string;
}

export function HookFormAutocomplete<
  T extends FieldValues,
  TOption extends BaseOption = BaseOption
>({
  name,
  label,
  options,
  rules,
  placeholder = "Seleccionar...",
  getOptionLabel,
  isOptionEqualToValue,
  onOptionSelected,
  disableClearable = false,
  className,
  control,

  allowCreate = false,
  createLabel = (value) => `Agregar "${value}"`,
  onCreateOption,

  onOpenModal,
  modalIcon,
  modalTitle = "Editar",
}: HookFormAutocompleteProps<T, TOption>) {
  const methods = useFormContext<T>();
  const ctrl = control ?? methods.control;

  const defaultGetOptionLabel =
    getOptionLabel ??
    ((option: TOption) =>
      typeof option === "object" && option?.label ? option.label : "");

  const defaultIsEqual =
    isOptionEqualToValue ??
    ((option: TOption, value: any) =>
      option?.value === (value?.value ?? value));

  const filter = createFilterOptions<TOption & { inputValue?: string }>();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    // Let MUI handle option selection first
    if (event.defaultPrevented || (event as any).defaultMuiPrevented) return;

    event.preventDefault();
    const moved = focusNextInput(event.currentTarget);
    if (!moved) {
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <Controller
      control={ctrl}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => {
        const selectedOption =
          options.find((opt) => defaultIsEqual(opt, field.value)) ?? null;

        const normalizedValue =
          allowCreate && !selectedOption && field.value
            ? ({
                label: String(field.value),
                value: field.value,
              } as unknown as TOption)
            : selectedOption;

        return (
          <div className={`space-y-2 ${className ?? ""}`}>
            {/* Label */}
            <label className="block text-sm font-semibold text-gray-700">
              {label}
            </label>

            <Autocomplete
              size="small"
              options={options}
              value={normalizedValue}
              freeSolo={allowCreate}
              disableClearable={disableClearable}
              getOptionLabel={(option) => {
                if (allowCreate && (option as any)?.inputValue) {
                  return (option as any)?.label ?? (option as any).inputValue;
                }
                return defaultGetOptionLabel(option as TOption);
              }}
              isOptionEqualToValue={defaultIsEqual}
              filterOptions={
                allowCreate
                  ? (opts, params) => {
                      const filtered = filter(opts, params);
                      const input = params.inputValue.trim();
                      const exists = opts.some((opt) =>
                        defaultIsEqual(opt, {
                          value: input,
                          label: input,
                        } as unknown as TOption)
                      );

                      if (input !== "" && !exists) {
                        filtered.push({
                          label: createLabel(input),
                          value: input,
                          inputValue: input,
                        } as TOption & { inputValue?: string });
                      }

                      return filtered;
                    }
                  : undefined
              }
              onChange={(_, option) => {
                if (!option) {
                  field.onChange(null);
                  onOptionSelected?.(null);
                  return;
                }

                if (
                  allowCreate &&
                  typeof option === "object" &&
                  (option as any).inputValue
                ) {
                  const inputVal = (option as any).inputValue as string;
                  field.onChange(inputVal);
                  onCreateOption?.(inputVal);
                  onOptionSelected?.({
                    label: inputVal,
                    value: inputVal,
                  } as unknown as TOption);
                  return;
                }

                const nextValue = (option as any).value ?? option;
                field.onChange(nextValue);
                onOptionSelected?.(option as TOption);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder={placeholder}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  variant="outlined"
                  fullWidth
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
                      minHeight: 48,
                    },
                    "& .MuiOutlinedInput-input": {
                      padding: "6px 10px",
                      fontSize: "0.75rem",
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    inputProps: {
                      ...params.InputProps?.inputProps,
                      ...params.inputProps,
                      "data-auto-next": "true",
                      onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
                        params.inputProps?.onKeyDown?.(event);
                        params.InputProps?.inputProps?.onKeyDown?.(event);
                        handleKeyDown(event);
                      },
                    },
                    endAdornment: (
                      <Box className="flex items-center gap-1 pr-1">
                        {params.InputProps.endAdornment}

                        {onOpenModal && (
                          <IconButton
                            size="small"
                            title={modalTitle}
                            disabled={!selectedOption}
                            onClick={() =>
                              selectedOption && onOpenModal(selectedOption)
                            }
                            sx={{
                              color: "#2563eb",
                              "&:hover": {
                                backgroundColor: "rgba(37,99,235,0.1)",
                              },
                            }}
                          >
                            {modalIcon ?? <Pencil size={18} />}
                          </IconButton>
                        )}
                      </Box>
                    ),
                  }}
                />
              )}
            />
          </div>
        );
      }}
    />
  );
}
