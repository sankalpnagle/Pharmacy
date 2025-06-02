import axiosInstance from "@/utils/axiosInstance";

export async function getAllProduct() {
  const res = await axiosInstance.get("/api/products");
  return res;
}
export async function productById(id: String) {
  const res = await axiosInstance.get(`/api/products/${id}`);
  return res;
}
export async function productDeleteId(id: String) {
  const res = await axiosInstance.delete(`/api/products/${id}`);
  return res;
}

export async function createProduct(formData: FormData) {
  const res = await axiosInstance.post("/api/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res;
}

export async function bulkUploadProducts(formData: FormData) {
  const res = await axiosInstance.post("/api/products/bulk-upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res;
}

export async function editProduct(id: String, formData: FormData) {
  const res = await axiosInstance.patch(`/api/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res;
}
