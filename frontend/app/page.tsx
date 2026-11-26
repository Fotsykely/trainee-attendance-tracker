import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AttendanceForm } from "@/components/attendance-form";
import { ButtonLink } from "@/components/button";
import { DayPicker } from "@/components/day-picker";
import { PageSkeleton } from "@/components/page-skeleton";
import { getAttendanceDay } from "@/lib/api-client/attendance";
import { firstParam, parseIsoDay, todayIso } from "@/lib/dates";
import { formatLongDate } from "@/lib/format";
import { saveAttendanceAction } from "./actions";

export const metadata: Metadata = { title: "Pointage du jour" };

// The page renders its heading at once. Reading the query string and calling the API happen in a child
// inside its own <Suspense>, as Cache Components requires (see the README).
export default function AttendancePage(props: PageProps<"/">) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Pointage du jour</h1>
      <Suspense fallback={<PageSkeleton />}>
        <AttendanceContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function AttendanceContent({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const params = await searchParams;
  // "Today" changes every day: read it at request time, never at build time.
  await connection();
  const today = todayIso();
  // No date, or an invalid one in the URL: today.
  const date = parseIsoDay(firstParam(params.date)) ?? today;

  return (
    <>
      <DayPicker id="attendance-date" action="/" date={date} max={today} />
      {date > today ? <FutureDate /> : <AttendanceDay date={date} />}
    </>
  );
}

async function AttendanceDay({ date }: { date: string }) {
  const day = await getAttendanceDay(date);

  return (
    <section aria-labelledby="day-title">
      <h2 id="day-title" className="mb-4 text-lg font-semibold first-letter:uppercase">
        {formatLongDate(date)}
      </h2>
      {/* key: choosing another date starts a fresh form instead of keeping the previous choices. */}
      <AttendanceForm
        key={date}
        action={saveAttendanceAction.bind(null, date)}
        entries={day.entries}
        isRecorded={day.isRecorded}
      />
    </section>
  );
}

function FutureDate() {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-lg border border-destructive bg-surface p-4">
      <p className="font-semibold text-destructive">Impossible de pointer une date future.</p>
      <ButtonLink href="/" variant="secondary">
        Revenir à aujourd&apos;hui
      </ButtonLink>
    </div>
  );
}
