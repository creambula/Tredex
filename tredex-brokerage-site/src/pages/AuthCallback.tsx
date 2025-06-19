import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:3000/auth/me', {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Not logged in');
        const user = await res.json();

        localStorage.setItem('user', JSON.stringify(user));
        navigate('/portfolio');
      } catch (err) {
        console.error('Login failed:', err);
      }
    };

    fetchUser();
  }, [navigate]);

  return <p>Logging you in...</p>;
}
