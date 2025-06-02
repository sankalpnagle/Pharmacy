import axiosInstance from "@/utils/axiosInstance";

export async function placeOrder(formData: FormData) {
  const res = await axiosInstance.post("/api/orders", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res;
}

export async function getOrderByCode(code: String | null) {
  const res = await axiosInstance.get(
    `/api/payments/order-by-code?code=${code}`
  );
  return res;
}

export async function getOrderByUser() {
  const res = await axiosInstance.get(`/api/user/orders`);
  return res;
}

export async function getOrderByOrderId(id: String) {
  const res = await axiosInstance.get(`/api/orders/${id}`);
  return res;
}

export async function getAllOrder() {
  const res = await axiosInstance.get(`/api/orders`);
  return res;
}
export async function getAllPaidOrder() {
  const res = await axiosInstance.get(`/api/orders/paid`);
  return res;
}

export async function cancelOrder(orderId: string) {
  const res = await axiosInstance.post(`/api/orders/${orderId}/cancel`);
  return res;
}
