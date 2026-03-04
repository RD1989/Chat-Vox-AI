import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "./useApi";

export const useAuth = () => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { request } = useApi();

  const getSession = async () => {
    const token = localStorage.getItem("vox_session_token");
    if (!token) {
      setLoading(false);
      return;
    }

    const { data, error } = await request<any>(`me?token=${token}`);
    if (data && !error) {
      setUser(data);
    } else {
      localStorage.removeItem("vox_session_token");
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    getSession();
  }, [request]);

  const signOut = async () => {
    localStorage.removeItem("vox_session_token");
    setUser(null);
    navigate("/login");
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await request<any>("login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    if (data && data.session) {
      localStorage.setItem("vox_session_token", data.session.access_token);
      setUser(data.user);
      return { error: null };
    }

    return { error: error || "Falha no login" };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await request("signup", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName })
    });
    return { error };
  };

  return { user, loading, signOut, signIn, signUp };
};
