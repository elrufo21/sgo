import type {
  FieldValues,
  Path,
  RegisterOptions,
  Control,
} from "react-hook-form";
import { useFormContext, Controller } from "react-hook-form";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { Pencil } from "lucide-react";

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

  /** 🔹 MODAL */
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

  return (
    <Controller
      control={ctrl}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => {
        const selectedOption =
          options.find((opt) => defaultIsEqual(opt, field.value)) ?? null;

        return (
          <div className={`space-y-2 ${className ?? ""}`}>
            {/* Label */}
            <label className="block text-sm font-semibold text-gray-700">
              {label}
            </label>

            <Autocomplete
              options={options}
              value={selectedOption}
              disableClearable={disableClearable}
              getOptionLabel={defaultGetOptionLabel}
              isOptionEqualToValue={defaultIsEqual}
              onChange={(_, option) => {
                field.onChange(option ? (option as any).value ?? option : null);
                onOptionSelected?.(option);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
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
                    },
                    "& .MuiOutlinedInput-input": {
                      padding: "9px 12px",
                      fontSize: "0.875rem",
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
                />
              )}
            />
          </div>
        );
      }}
    />
  );
}
