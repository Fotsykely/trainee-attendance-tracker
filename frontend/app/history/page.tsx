import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { DayPicker } from "@/components/day-picker";
import { PageSkeleton } from "@/components/page-skeleton";
import { getAttendanceDay } from "@/lib/api-client/attendance";
import { firstParam, parseIsoDay, todayIso } from "@/lib/dates";
import { ATTENDANCE_LABELS, formatLongDate } from "@/lib/format";

export const metadata: Metadata = { title: "Historique" };

export default function HistoryPage(props: PageProps<"/history">) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Historique des pointages</h1>
      <Suspense fallback={<PageSkeleton />}>
        <HistoryContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function HistoryContent({ searchParams }: { searchParams: PageProps<"/history">["searchParams"] }) {
  const params = await searchParams;
  // "Today" changes every day: read it at request time, never at build time.
  await connection();
  const today = todayIso();
  const date = parseIsoDay(firstParam(params.date)) ?? today;

  return (
    <>
      <DayPicker id="history-date" action="/history" date={date} max={today} />
      <HistoryDay date={date} />
    </>
  );
}

async function HistoryDay({ date }: { date: string }) {
  const day = await getAttendanceDay(date);

  return (
    <section aria-labelledby="day-title">
      <h2 id="day-title" className="mb-4 text-lg font-semibold first-letter:uppercase">
        {formatLongDate(date)}
      </h2>

      {!day.isRecorded ? (
        <p className="rounded-lg border border-dashed border-border-input p-6 text-center text-muted-foreground">
          Aucun pointage pour cette date.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
          <table className="w-full text-left">
            <caption className="sr-only">Pointage du {formatLongDate(date)}</caption>
            <thead className="border-b border-border bg-background text-sm">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Stagiaire
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  État
                </th>
              </tr>
            </thead>
            <tbody>
              {day.entries.map((entry) => (
                <tr key={entry.traineeId} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-4 py-3 font-medium">
                    {entry.traineeName}
                  </th>
                  <td className="px-4 py-3">
                    {entry.status ? ATTENDANCE_LABELS[entry.status] : <span className="text-muted-foreground">Non pointé</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
