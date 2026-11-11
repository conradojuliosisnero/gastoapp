import { connection } from "next/server";
import { today } from "@/lib/money";
import ExtraIncomeForm from "./form";

export const metadata = { title: "Ingreso extra" };

export default async function ExtraIncomePage() {
  await connection(); // default date is the request day
  return <ExtraIncomeForm defaultDate={today()} />;
}
