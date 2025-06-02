import axiosInstance from "@/utils/axiosInstance";

export async function callCreatePaymentApi(data: { orderCode: string }) {
  const res = await axiosInstance.post("/api/payments/create", data);
  return res;
}
export async function updateOrderStatus(id: String, status: String) {
  const res = await axiosInstance.post(`/api/staff/orders/${id}/${status}`);
  return res;
}
export async function changeOrderStatus(id: String, status: String, data: any) {
  const res = await axiosInstance.post(
    `/api/staff/orders/${id}/${status}`,
    data
  );
  return res;
}
export async function confirmOrder(data: any) {
  const res = await axiosInstance.post(`/api/payments/confirm`, data);
  return res;
}
