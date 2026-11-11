
import axios from "axios";

const API = axios.create({ baseURL: "/api", withCredentials: true });

export const executeCode = async (language, sourceCode) => {
  const response = await API.post("/execute", { language, sourceCode });
  return response.data;
};