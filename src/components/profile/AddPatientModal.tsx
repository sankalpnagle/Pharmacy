"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DoctorSchema, LoginSchema, UserSchema } from "@/schemas";
import { useModal } from "@/hooks/useModal";
import SearchInput from "../custom_components/SearchInput";
import { PatientTable } from "../doctor-tables/PatientTable";

const AddPatientModal = () => {
  return (
    <div className="sm:px-6 sm:w-[90vw]">
      <PatientTable />
    </div>
  );
};

export default AddPatientModal;
