import { revalidatePath } from "next/cache";

// Every change touches several pages: the project list in the layout, the task counts on the home
// page and the project page itself. Refreshing everything is simpler than tracking each path.
export function revalidateAllPages(): void {
  revalidatePath("/", "layout");
}
