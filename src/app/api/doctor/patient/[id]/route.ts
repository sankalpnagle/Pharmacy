// File: app/api/doctor/patient-address/[patientId]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPatientById, updatePatientAddress } from "@/actions/doctor";
import { Role } from "@prisma/client";

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user || ![Role.DOCTOR].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const patientId = params.id;
  const body = await req.json();
  const response = await updatePatientAddress(session.user.id, patientId, body);
  return NextResponse.json(response, { status: response.error ? 400 : 200 });
}
export async function GET(
  _: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user || ![Role.DOCTOR].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const response = await getPatientById(session.user.id, params.id);
  return NextResponse.json(response, {
    status: response.error ? 400 : 200,
  });
}
