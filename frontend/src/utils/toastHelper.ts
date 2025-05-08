
import toast from "react-hot-toast";

export const showToast = {
  success: (msg: string) => toast.success(`✅ ${msg}`),
  error: (msg: string) => toast.error(`❌ ${msg}`),
};
