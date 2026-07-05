import { requireSession } from "@/lib/auth/requireSession";
import { getKpiDashboard } from "@/lib/airtable-kpis";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSession({ canViewKpis: true });
  if (!session) {
    return Response.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const data = await getKpiDashboard();
    return Response.json(data);
  } catch (err) {
    console.error("Failed to compute KPI dashboard", err);
    return Response.json(
      { message: "No se pudieron cargar los indicadores." },
      { status: 502 },
    );
  }
}
