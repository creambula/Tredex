import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Homes from './pages/Homes';
import Portfolio from './pages/Portfolio';
import Account from './pages/Account';
import Trade from './pages/Trade';
import AuthCallback from './pages/AuthCallback';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Home page */}
        <Route path="/" element={<Homes />} />

        <Route path="/auth/callback" element={<AuthCallback />} /> {/* <-- new */}

        {/* Authenticated routes inside the Layout */}
        <Route path="/" element={<Layout />}>
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="account" element={<Account />} />
          <Route path="trade" element={<Trade />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;