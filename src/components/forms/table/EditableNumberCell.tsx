import React, { useState, useEffect } from "react";

const EditableNumberCell = ({ getValue, row, column, table }) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);

  const onBlur = () => {
    table.options.meta?.updateData(row.index, column.id, Number(value));
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      className="w-full px-2 py-1 border border-gray-300 text-right rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
};
export default EditableNumberCell;
