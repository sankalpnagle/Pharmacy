import axiosInstance from "@/utils/axiosInstance";

export async function getAllCategory() {
  const res = await axiosInstance.get("/api/category");
  return res;
}
export async function getCategoryById(id: string) {
  const res = await axiosInstance.get(`/api/category/${id}`);
  return res;
}
