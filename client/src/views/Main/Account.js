import React from 'react';
import { Container, Tabs, Tab, Alert, Spinner } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProfileTab from '../../components/account/ProfileTab';
import OrdersTab from '../../components/account/OrdersTab';
import SecurityTab from '../../components/account/SecurityTab';

// Tabbed account management. To add a section, write a component in
// components/account/ and add an entry here — the active tab is kept in the URL
// (?tab=orders) so it survives refreshes and can be linked to.
const ACCOUNT_TABS = [
  { key: 'profile', title: 'Profile', Component: ProfileTab },
  { key: 'orders', title: 'Orders', Component: OrdersTab },
  { key: 'security', title: 'Security', Component: SecurityTab },
];

function Account() {
  const { authChecked, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const activeTab = ACCOUNT_TABS.some((t) => t.key === requested) ? requested : ACCOUNT_TABS[0].key;

  if (!authChecked) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" size="sm" /> Loading account…
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="mt-4">
        <Alert variant="info">
          Please <Link to="/login">log in</Link> to see your account.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Your Account</h2>
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setSearchParams({ tab: key }, { replace: true })}
        className="mb-4"
        // Only the visible tab is mounted, so each tab loads its data when opened.
        mountOnEnter
        unmountOnExit
      >
        {ACCOUNT_TABS.map(({ key, title, Component }) => (
          <Tab key={key} eventKey={key} title={title}>
            <Component />
          </Tab>
        ))}
      </Tabs>
    </Container>
  );
}

export default Account;
