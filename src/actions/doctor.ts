// src/actions/doctor.ts
"use server";

import { prisma } from "@/lib/prisma";
import { PatientSchema, AddressSchema } from "@/schemas";
import * as z from "zod";

// ✅ Doctor Adds Patient with Address
export const addPatientWithAddress = async (
  doctorId: string,
  patientData: z.infer<typeof PatientSchema>,
  addressData: z.infer<typeof AddressSchema>
) => {
  const validatePatient = PatientSchema.safeParse(patientData);
  const validateAddress = AddressSchema.safeParse(addressData);

  if (!validatePatient.success || !validateAddress.success) {
    return { error: "Invalid patient or address data!" };
  }

  try {
    const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.role !== "DOCTOR") {
      return { error: "Only doctors can add patients!" };
    }

    if (patientData.email) {
      const existingPatients = await prisma.patient.count({
        where: {
          email: patientData.email,
          doctorId: doctorId,
        },
      });
      if (existingPatients > 0) {
        console.warn("Warning: Email already exists for another patient");
      }
    }

    const patient = await prisma.patient.create({
      data: {
        ...validatePatient.data,
        doctorId,
      },
    });

    const address = await prisma.deliveryAddress.create({
      data: {
        ...validateAddress.data,
        patientId: patient.id,
      },
    });

    return { success: true, patient, address };
  } catch (error) {
    console.error("Add Patient Error:", error);
    return { error: "Failed to add patient with address!" };
  }
};

// ✅ Get All Patients for a Doctor (Including Address Details)
export const getAllPatients = async (doctorId: string) => {
  try {
    const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.role !== "DOCTOR") {
      return { error: "Only doctors can retrieve patients!" };
    }

    const patients = await prisma.patient.findMany({
      where: { doctorId },
      include: {
        deliveryAddress: true,
      },
    });
    return {
      success: true,
      patients: patients.map((patient) => ({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        createdAt: patient.createdAt,
        address: patient.deliveryAddress || null,
      })),
    };
  } catch (error) {
    console.error("Get Patients Error:", error);
    return { error: "Failed to retrieve patients!" };
  }
};

// Doctor update patient address
export const updatePatientAddress = async (
  doctorId: string,
  patientId: string,
  addressData: z.infer<typeof AddressSchema>
) => {
  const validate = AddressSchema.safeParse(addressData);
  if (!validate.success) return { error: "Invalid address data!" };

  try {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, doctorId },
    });
    if (!patient) return { error: "Patient not found or unauthorized!" };

    const existing = await prisma.deliveryAddress.findUnique({
      where: { patientId },
    });

    const address = existing
      ? await prisma.deliveryAddress.update({
          where: { patientId },
          data: validate.data,
        })
      : await prisma.deliveryAddress.create({
          data: {
            ...validate.data,
            patientId,
          },
        });

    return { success: true, address };
  } catch (error) {
    console.error("Update Patient Address Error:", error);
    return { error: "Failed to update patient address!" };
  }
};

// ✅ Get single patient by ID (with address)
export const getPatientById = async (doctorId: string, patientId: string) => {
  try {
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      return { error: "Only doctors can access this resource." };
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        deliveryAddress: true,
      },
    });

    if (!patient || patient.doctorId !== doctorId) {
      return { error: "Patient not found or unauthorized." };
    }

    return {
      success: true,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        birthDate: patient.birthDate,
        createdAt: patient.createdAt,
        address: patient.deliveryAddress || null,
      },
    };
  } catch (error) {
    console.error("Get Patient By ID Error:", error);
    return { error: "Failed to fetch patient details." };
  }
};
