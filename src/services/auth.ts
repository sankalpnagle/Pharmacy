import axiosInstance from "@/utils/axiosInstance";

export async function createUser(formData: FormData) {
  const res = await axiosInstance.post("/api/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res;
}

export async function forgetPassord(data: any) {
  const res = await axiosInstance.post("/api/resetpassword", data);
  return res;
}
