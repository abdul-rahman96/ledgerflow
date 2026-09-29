import { OperatorConsole } from "@/components/operator-console";
import { getOperatorState } from "@/lib/operator-api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const state = await getOperatorState();
  return <OperatorConsole state={state} />;
}
