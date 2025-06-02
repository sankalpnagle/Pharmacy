// app/api/doctor/patient/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addPatientWithAddress, getAllPatients } from "@/actions/doctor";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || ![Role.DOCTOR].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, address } = body;

    if (!name || !address) {
      return NextResponse.json(
        { error: "Missing required fields!" },
        { status: 400 }
      );
    }

    const patientData = { name, email, phone };
    const response = await addPatientWithAddress(
      session.user.id,
      patientData,
      address
    );

    return NextResponse.json(response, { status: response.error ? 400 : 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Invalid request payload!" },
      { status: 400 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user || ![Role.DOCTOR].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const response = await getAllPatients(session.user.id);
  return NextResponse.json(response, { status: response.error ? 400 : 200 });
}
