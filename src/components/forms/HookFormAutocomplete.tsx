import type {
  FieldValues,
  Path,
  RegisterOptions,
  Control,
} from "react-hook-form";
import { useFormContext, Controller } from "react-hook-form";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import type { FilterOptionsState } from "@mui/material/useAutocomplete";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { Pencil } from "lucide-react";
import type { KeyboardEvent } from "react";
import {
  focusNextInput,
  focusPreviousInput,
} from "@/shared/helpers/focusNextInput";

type BaseOption = {
  label: string;
  value: string | number;
} & Record<string, unknown>;

type CreateOption = BaseOption & { inputValue?: string };
type MuiKeyboardEvent = KeyboardEvent<HTMLInputElement> & {
  defaultMuiPrevented?: boolean;
};

interface HookFormAutocompleteProps<
  T extends FieldValues,
  TOption extends BaseOption = BaseOption,
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
  autoComplete?: string;
  control?: Control<T>;
  disabled?: boolean;

  allowCreate?: boolean;
  createLabel?: (value: string) => string;
  onCreateOption?: (value: string) => void;
  filterOptions?: (
    options: (TOption & { inputValue?: string })[],
    state: FilterOptionsState<TOption & { inputValue?: string }>,
  ) => (TOption & { inputValue?: string })[];

  onOpenModal?: (option: TOption) => void;
  modalIcon?: React.ReactNode;
  modalTitle?: string;
}

export function HookFormAutocomplete<
  T extends FieldValues,
  TOption extends BaseOption = BaseOption,
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
  disabled = false,

  allowCreate = false,
  createLabel = (value) => `Agregar "${value}"`,
  onCreateOption,
  filterOptions,

  onOpenModal,
  modalIcon,
  modalTitle = "Editar",
}: HookFormAutocompleteProps<T, TOption>) {
  const methods = useFormContext<T>();
  const ctrl = control ?? methods.control;
  const resolveValue = (val: unknown) =>
    typeof val === "object" && val !== null && "value" in val
      ? (val as { value: unknown }).value
      : val;

  const defaultGetOptionLabel =
    getOptionLabel ??
    ((option: TOption) =>
      typeof option === "object" && option?.label ? option.label : "");

  const defaultIsEqual =
    isOptionEqualToValue ??
    ((option: TOption, value: unknown) =>
      option?.value === resolveValue(value));

  const filter = createFilterOptions<TOption & { inputValue?: string }>();
  const resolvedAutoComplete = "off";
  const appliedFilterOptions =
    filterOptions ??
    (allowCreate
      ? (opts: (TOption & { inputValue?: string })[], params) => {
          const filtered = filter(opts, params);
          const input = (params.inputValue ?? "").trim();
          const exists = opts.some((opt) =>
            defaultIsEqual(opt, {
              value: input,
              label: input,
            } as unknown as TOption),
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
      : undefined);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const isPopupOpen =
      event.currentTarget.getAttribute("aria-expanded") === "true";
    const source = event.target as HTMLElement;
    const input = event.target as HTMLInputElement;

    const shouldMoveHorizontal = (direction: "left" | "right"): boolean => {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      if (start === null || end === null) return true;
      if (start !== end) return false;
      return direction === "left" ? start === 0 : end === input.value.length;
    };

    if (event.key === "ArrowUp" && !isPopupOpen) {
      event.preventDefault();
      focusPreviousInput(source);
      return;
    }

    if (event.key === "ArrowDown" && !isPopupOpen) {
      event.preventDefault();
      focusNextInput(source);
      return;
    }

    if (
      event.key === "ArrowLeft" &&
      !isPopupOpen &&
      shouldMoveHorizontal("left")
    ) {
      event.preventDefault();
      focusPreviousInput(source);
      return;
    }

    if (
      event.key === "ArrowRight" &&
      !isPopupOpen &&
      shouldMoveHorizontal("right")
    ) {
      event.preventDefault();
      focusNextInput(source);
      return;
    }

    if (event.key !== "Enter") return;

    // Let MUI handle option selection first
    if (
      event.defaultPrevented ||
      (event as MuiKeyboardEvent).defaultMuiPrevented
    )
      return;

    event.preventDefault();
    const moved = focusNextInput(source);
    if (!moved) {
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className={`mt-3 ${className ?? ""}`}>
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
            <Autocomplete
              fullWidth
              size="small"
              options={options}
              value={normalizedValue}
              freeSolo={allowCreate}
              disabled={disabled}
              disableClearable={disableClearable}
              getOptionLabel={(option) => {
                const optionWithInput = option as TOption & CreateOption;
                if (allowCreate && optionWithInput.inputValue) {
                  return optionWithInput.label ?? optionWithInput.inputValue;
                }
                return defaultGetOptionLabel(option as TOption);
              }}
              isOptionEqualToValue={defaultIsEqual}
              filterOptions={appliedFilterOptions}
              onChange={(event, option) => {
                const moveToNext = () => {
                  const source = event.target as HTMLElement;
                  const moved = focusNextInput(source);
                  if (moved) return;

                  const active =
                    source.ownerDocument?.activeElement ??
                    document.activeElement;
                  if (active instanceof HTMLElement) {
                    focusNextInput(active);
                  }
                };

                if (!option) {
                  field.onChange(null);
                  onOptionSelected?.(null);
                  return;
                }

                if (
                  allowCreate &&
                  typeof option === "object" &&
                  option !== null &&
                  "inputValue" in option &&
                  typeof option.inputValue === "string"
                ) {
                  const inputVal = option.inputValue;
                  field.onChange(inputVal);
                  onCreateOption?.(inputVal);
                  onOptionSelected?.({
                    label: inputVal,
                    value: inputVal,
                  } as unknown as TOption);
                  window.requestAnimationFrame(moveToNext);
                  return;
                }

                const nextValue =
                  typeof option === "object" &&
                  option !== null &&
                  "value" in option
                    ? option.value
                    : option;
                field.onChange(nextValue);
                onOptionSelected?.(option as TOption);
                window.requestAnimationFrame(moveToNext);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label={label || undefined}
                  placeholder={placeholder}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  variant="outlined"
                  fullWidth
                  autoComplete={resolvedAutoComplete}
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
                    "& .MuiOutlinedInput-input": {
                      fontSize: "0.875rem",
                      py: 1,
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
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
                  inputProps={{
                    ...params.inputProps,
                    "data-auto-next": "true",
                    autoComplete: resolvedAutoComplete,
                    autoCorrect: "off",
                    autoCapitalize: "off",
                    spellCheck: false,
                    "data-lpignore": "true",
                    "data-1p-ignore": "true",
                    "data-bwignore": "true",
                    "data-form-type": "other",
                  }}
                  onKeyDown={(event) => {
                    params.inputProps?.onKeyDown?.(
                      event as unknown as KeyboardEvent<HTMLInputElement>,
                    );
                    handleKeyDown(event as KeyboardEvent<HTMLInputElement>);
                  }}
                />
              )}
            />
          );
        }}
      />
    </div>
  );
}
