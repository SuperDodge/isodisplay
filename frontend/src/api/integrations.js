const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function UploadFile({ file }) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API}/api/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// Placeholder stubs for integrations not yet implemented
export async function InvokeLLM() {
  throw new Error("InvokeLLM not implemented");
}
export async function SendEmail() {
  throw new Error("SendEmail not implemented");
}
export async function GenerateImage() {
  throw new Error("GenerateImage not implemented");
}
export async function ExtractDataFromUploadedFile() {
  throw new Error("ExtractDataFromUploadedFile not implemented");
}
