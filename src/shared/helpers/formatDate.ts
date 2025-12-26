const pad = (value: number) => value.toString().padStart(2, "0");

export const formatDate = (value?: string | number | Date | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
