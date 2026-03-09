import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "./useApi";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { call } = useApi();

  useEffect(() => {
    const savedUser = localStorage.getItem('local_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signOut = async () => {
    localStorage.removeItem('local_user');
    localStorage.removeItem('local_auth_token');
    setUser(null);
    navigate("/login");
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await call('auth/login', 'POST', { email, password });
      if (data.user) {
        localStorage.setItem('local_user', JSON.stringify(data.user));
        localStorage.setItem('local_auth_token', data.access_token);
        setUser(data.user);
        return { error: null };
      }
      return { error: { message: 'Erro desconhecido' } };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const data = await call('auth/auth.php?action=register', 'POST', { email, password, full_name: fullName });
      if (data.success) {
        return { error: null };
      }
      return { error: { message: data.error || 'Erro no cadastro' } };
    } catch (error: any) {
      return { error };
    }
  };

  return { user, loading, signOut, signIn, signUp };
};
