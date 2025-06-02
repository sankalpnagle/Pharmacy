import axiosInstance from "@/utils/axiosInstance";

export async function getUserAddressByUserId() {
  const res = await axiosInstance.get(`/api/user/address`);
  return res;
}

export async function addAddress(data: any) {
  const res = await axiosInstance.post(`/api/user/address`, data);
  return res;
}
export async function editAddress(data: any) {
  const res = await axiosInstance.put(`/api/user/address`, data);
  return res;
}

export async function editProfileImage(formData: FormData) {
  const res = await axiosInstance.post("/api/user/update-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res;
}
export async function editProfile(formData: FormData) {
  const res = await axiosInstance.post("/api/user/update-info", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res;
}
