import React, { useEffect, useMemo, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";

type Option = {
  label: string;
  value: string | number;
  data?: any;
};

const AutocompleteTableCell = ({ getValue, row, column, table }) => {
  const options: Option[] = column.columnDef.meta?.options || [];
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [inputValue, setInputValue] = useState("");

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [options, value]
  );

  useEffect(() => {
    setValue(initialValue);
    const matched = options.find((opt) => opt.value === initialValue) ?? null;
    setInputValue(matched?.label ?? "");
  }, [initialValue, options]);

  const applyProductToRow = (option: Option | null) => {
    const updateRow = table.options.meta?.updateRow;
    const updateData = table.options.meta?.updateData;
    const product = option?.data ?? null;

    const fallbackUpdate = () => {
      updateData?.(row.index, column.id, option?.value ?? null);
      updateData?.(row.index, "codigo", product?.codigo ?? "");
      updateData?.(row.index, "nombre", product?.nombre ?? "");
      updateData?.(row.index, "unidadMedida", product?.unidadMedida ?? "");
      updateData?.(row.index, "stock", Number(product?.cantidad ?? 0));
      updateData?.(row.index, "preCosto", Number(product?.preCosto ?? 0));
      updateData?.(row.index, "preVenta", Number(product?.preVenta ?? 0));
    };

    if (updateRow) {
      updateRow(row.index, (currentRow = {}) => {
        const cantidad =
          currentRow.cantidad !== undefined ? currentRow.cantidad : 1;
        if (!option) {
          return {
            ...currentRow,
            productId: null,
            codigo: "",
            nombre: "",
            unidadMedida: "",
            stock: 0,
            preCosto: 0,
            preVenta: 0,
            cantidad,
          };
        }

        return {
          ...currentRow,
          productId: option.value,
          codigo: product?.codigo ?? "",
          nombre: product?.nombre ?? "",
          unidadMedida: product?.unidadMedida ?? "",
          stock: Number(product?.cantidad ?? 0),
          preCosto: Number(product?.preCosto ?? 0),
          preVenta: Number(product?.preVenta ?? 0),
          cantidad,
        };
      });
      return;
    }

    fallbackUpdate();
  };

  return (
    <Autocomplete
      size="small"
      fullWidth
      options={options}
      value={selectedOption}
      inputValue={inputValue}
      filterOptions={(opts, state) =>
        opts.filter((opt) =>
          opt.label
            .toLowerCase()
            .includes((state.inputValue ?? "").toLowerCase())
        )
      }
      getOptionLabel={(option) => option.label ?? ""}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      onChange={(_, option) => {
        setValue(option?.value ?? "");
        setInputValue(option?.label ?? "");
        applyProductToRow(option ?? null);
      }}
      onInputChange={(_, newInputValue, reason) => {
        setInputValue(newInputValue);
        if (reason === "clear") {
          setValue("");
          applyProductToRow(null);
        }
      }}
      renderInput={(params) => <TextField {...params} label="Buscar..." />}
    />
  );
};

export default AutocompleteTableCell;
