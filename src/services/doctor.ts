import axiosInstance from "@/utils/axiosInstance";

export async function addPatient(data: any) {
  const res = await axiosInstance.post(`/api/doctor/patient`, data);
  return res;
}

export async function getAllPatient() {
  const res = await axiosInstance.get(`/api/doctor/patient`);
  return res;
}
