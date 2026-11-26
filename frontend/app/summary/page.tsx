import type { Metadata } from "next";
import Form from "next/form";
import { connection } from "next/server";
import { Suspense } from "react";
import { Button } from "@/components/button";
import { InputField } from "@/components/field";
import { PageSkeleton } from "@/components/page-skeleton";
import { getSummary } from "@/lib/api-client/attendance";
import { firstDayOfMonthIso, firstParam, parseIsoDay, todayIso } from "@/lib/dates";
import { formatDate, formatRate } from "@/lib/format";

export const metadata: Metadata = { title: "Bilan" };

export default function SummaryPage(props: PageProps<"/summary">) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Bilan de présence</h1>
      <Suspense fallback={<PageSkeleton />}>
        <SummaryContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function SummaryContent({ searchParams }: { searchParams: PageProps<"/summary">["searchParams"] }) {
  const params = await searchParams;
  // "Today" changes every day: read it at request time, never at build time.
  await connection();
  const today = todayIso();
  // Missing or invalid dates in the URL: from the first of the month until today.
  const from = parseIsoDay(firstParam(params.from)) ?? firstDayOfMonthIso();
  const to = parseIsoDay(firstParam(params.to)) ?? today;
  const endBeforeStart = to < from;

  return (
    <>
      <Form action="/summary" className="mb-6 flex flex-wrap items-start gap-3">
        <div className="w-full sm:w-56">
          <InputField id="summary-from" label="Date de début" name="from" type="date" defaultValue={from} required />
        </div>
        <div className="w-full sm:w-56">
          <InputField
            id="summary-to"
            label="Date de fin"
            name="to"
            type="date"
            defaultValue={to}
            required
            errors={endBeforeStart ? ["La date de fin ne peut pas précéder la date de début."] : undefined}
          />
        </div>
        {/* Aligned with the inputs, not with their (possibly longer) error message. */}
        <Button type="submit" variant="secondary" className="sm:mt-[1.625rem]">
          Afficher le bilan
        </Button>
      </Form>

      {!endBeforeStart && <SummaryTable from={from} to={to} />}
    </>
  );
}

async function SummaryTable({ from, to }: { from: string; to: string }) {
  const summary = await getSummary(from, to);

  return (
    <section aria-labelledby="summary-title">
      <h2 id="summary-title" className="mb-4 text-lg font-semibold">
        Du {formatDate(from)} au {formatDate(to)}
      </h2>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[34rem] text-left">
          <caption className="sr-only">
            Jours présents, en retard et absents par stagiaire, du {formatDate(from)} au {formatDate(to)}
          </caption>
          <thead className="border-b border-border bg-background text-sm">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Stagiaire
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Présent
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                En retard
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Absent
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Taux de présence
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Taux de retard
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.map((line) => (
              <tr key={line.traineeId} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-4 py-3 font-medium">
                  {line.traineeName}
                </th>
                <td className="px-4 py-3 text-right">{line.presentDays}</td>
                <td className="px-4 py-3 text-right">{line.lateDays}</td>
                <td className="px-4 py-3 text-right">{line.absentDays}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  <Rate value = {line.attendanceRate} />
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  <Rate value = {line.lateRate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Les retards comptent comme des présences. Le taux se calcule sur les jours pointés ; « — » signifie qu&apos;aucun
        jour n&apos;a été pointé sur la période.
      </p>
    </section>
  );
}

function Rate({value}: {value: number | null})
{
    return (
        <>
            {formatRate(value)}
            {value === null && <span className="sr-only"> (aucun pointage sur la période)</span>}
        </>
    );
}
