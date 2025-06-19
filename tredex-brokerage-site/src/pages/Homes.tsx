import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    window.location.href = 'http://localhost:3000/auth/discord'; // your backend
  }, []);

  return <p>Redirecting to Discord login...</p>;
}