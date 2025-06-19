import { Outlet, useNavigate  } from 'react-router-dom';
import { Home, User, TrendingUp, Briefcase, Settings, LogOut, BadgeCent } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.scss';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  //const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  //const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { name: 'HOME', href: '/', icon: Home },
    { name: 'ACCOUNT', href: '/account', icon: User },
    { name: 'TRADE', href: '/trade', icon: TrendingUp },
    { name: 'PORTFOLIO', href: '/portfolio', icon: Briefcase },
  ];

  if (user?.isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Settings });
  }

  return (
  <div className={styles.container}>
    <nav className={styles.navbar}>
      <div className={styles.logoSection}>
        <BadgeCent className={styles.logoIcon} />
        <span className={styles.logoText}>Tredex</span>
      </div>

      {/* 🔹 ADD THIS: Nav Links */}
      <div className={styles.navLinks}>
        {navigation.map((item) => (
          <button
            key={item.name}
            className={styles.navButton}
            onClick={() => navigate(item.href)}
          >
            <item.icon className={styles.icon} />
            {item.name}
          </button>
        ))}
      </div>

      {/* 🔹 Already existing: Profile section */}
      {user && (
        <div className={styles.profileSection}>
          <div className={styles.profileText}>
            <div className={styles.username}>{user.ign}</div>
            <div className={styles.balance}>
              ${user.cashBalance?.toLocaleString()}
            </div>
          </div>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <LogOut className={styles.logoutIcon} />
          </button>
        </div>
      )}
    </nav>

    <main className={styles.mainContent}>
      <Outlet />
    </main>
  </div>
);
}