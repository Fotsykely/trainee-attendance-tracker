import Form from "next/form";
import { InputField } from "@/components/field";
import { Button } from "@/components/button";

type DayPickerProps = {
  // Unique among the pages (Next keeps the previous page hidden in the DOM): the label points to it.
  id: string;
  // Page that receives the chosen date as ?date=yyyy-MM-dd.
  action: string;
  date: string;
  // The latest selectable day (today): a hint for the browser, the API enforces the rule.
  max: string;
};

// "Choose a day" form, shared by the attendance and history pages. It is a GET form:
// the date lands in the URL, so the page can be bookmarked and the back button works.
export function DayPicker({ id, action, date, max }: DayPickerProps) {
  return (
    <Form action={action} className="mb-6 flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-64">
        <InputField id={id} label="Date" name="date" type="date" defaultValue={date} max={max} required />
      </div>
      <Button type="submit" variant="secondary">
        Afficher
      </Button>
    </Form>
  );
}
