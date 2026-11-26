// FormData values are a string or a File; our forms only have text fields.
export function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}
