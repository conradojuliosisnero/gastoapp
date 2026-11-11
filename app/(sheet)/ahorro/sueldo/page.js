import { connection } from "next/server";
import { monthRange } from "@/lib/money";
import SalaryForm from "./form";

export const metadata = { title: "Sueldo" };

export default async function SueldoPage() {
  await connection(); // "this month" depends on the request date
  return <SalaryForm defaultPeriod={monthRange().key} />;
}
