import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import ReportIssue from './ReportIssue.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('civifix_theme') === 'dark'
  );

  useEffect(() => {
    const token = localStorage.getItem('civifix_token');

    if (token) {
      fetch(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          setUser(data.user);
          setPage('dashboard');
        })
        .catch(() => {
          localStorage.removeItem('civifix_token');
        });
    }

    fetch(`${API}/issues`)
      .then(res => res.json())
      .then(data => setIssues(data.issues || []))
      .catch(() => {});
  }, []);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('civifix_theme', next ? 'dark' : 'light');
  }

  function logout() {
    localStorage.removeItem('civifix_token');
    setUser(null);
    setPage('home');
  }

  const navbarProps = {
    user,
    onLogin: () => setPage('login'),
    onRegister: () => setPage('register'),
    onLogout: logout,
    darkMode,
    toggleTheme
  };

  if (page === 'login') {
    return (
      <div className={darkMode ? 'app dark-mode' : 'app'}>
        <Login
          onBack={() => setPage('home')}
          onSuccess={u => {
            setUser(u);
            setPage('dashboard');
          }}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />
      </div>
    );
  }

  if (page === 'register') {
    return (
      <div className={darkMode ? 'app dark-mode' : 'app'}>
        <Register
          onBack={() => setPage('home')}
          onSuccess={u => {
            setUser(u);
            setPage('dashboard');
          }}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />
      </div>
    );
  }

  if (page === 'dashboard') {
    return (
      <div className={darkMode ? 'app dark-mode' : 'app'}>
        <Navbar {...navbarProps} />

        <main className="dashboard-page">
          <div className="dashboard-header">
            <div>
              <span className="section-label">CITIZEN DASHBOARD</span>

              <h1>
                Good to see you,{' '}
                {user?.name?.split(' ')[0]}.
              </h1>

              <p>
                Help your community identify problems and get them fixed.
              </p>
            </div>

            <button
                className="primary-btn"
                onClick={() => setPage('report')}
            >
            <span>+</span> Report an issue
            </button>
          </div>

          <section className="issue-section">
            <div className="section-heading">
              <div>
                <span className="section-label">COMMUNITY</span>
                <h2>Active civic issues</h2>
              </div>

              <span className="live-pill">
                <i /> LIVE
              </span>
            </div>

            {issues.length ? (
              <div className="issue-grid">
                {issues.map(issue => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">◎</div>
                <h3>No issues reported yet</h3>
                <p>
                  Your community is ready for its first report.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }
  if (page === 'report') {
  return (
    <div className={darkMode ? 'app dark-mode' : 'app'}>
      <ReportIssue
        user={user}
        onBack={() => setPage('dashboard')}
      />
    </div>
  );
}

  return (
    <div className={darkMode ? 'app dark-mode' : 'app'}>
      <Navbar {...navbarProps} />

      <main>
        {/* HERO */}

        <section className="hero">
          <div className="hero-copy">

            <div className="hero-badge">
              <span className="pulse-dot" />
              BUILT FOR BETTER COMMUNITIES
            </div>

            <h1>
              Your city.
              <br />
              <em>Your voice.</em>
              <br />
              <span>Real action.</span>
            </h1>

            <p className="hero-description">
              CiviFix turns everyday civic problems into visible,
              prioritized issues — helping citizens and authorities
              work together to fix what matters.
            </p>

            <div className="hero-actions">

              <button
                className="primary-btn large"
                onClick={() => {
                    if (user) {
                        setPage('report');
                    } else {
                        setPage('register');
                    }
                }}
              >
                Report a problem
                <span className="arrow">↗</span>
              </button>

              <button
                className="text-btn"
                onClick={() =>
                  document
                    .getElementById('how')
                    ?.scrollIntoView({
                      behavior: 'smooth'
                    })
                }
              >
                See how it works <span>↓</span>
              </button>

            </div>

            <div className="trust-row">

              <div className="avatar-stack">
                <span>R</span>
                <span>A</span>
                <span>S</span>
                <span>+</span>
              </div>

              <div>
                <strong>Community powered</strong>
                <small>
                  Every report can make a difference.
                </small>
              </div>

            </div>

          </div>

          {/* HERO VISUAL */}

          <div className="hero-visual">

            <div className="glow glow-one" />
            <div className="glow glow-two" />

            <div className="city-card">

              <div className="city-top">
                <span>COMMUNITY MAP</span>

                <span className="map-live">
                  <i /> LIVE
                </span>
              </div>

              <div className="fake-map">

                <div className="map-road road-a" />
                <div className="map-road road-b" />
                <div className="map-road road-c" />
                <div className="map-road road-d" />

                <div className="map-block block-one" />
                <div className="map-block block-two" />
                <div className="map-block block-three" />
                <div className="map-block block-four" />

                <div className="map-pin pin-one">
                  <span />
                </div>

                <div className="map-pin pin-two">
                  <span />
                </div>

                <div className="map-pin pin-three">
                  <span />
                </div>

                <div className="map-center">
                  <div className="center-ring">
                    <span />
                  </div>
                </div>

              </div>

              <div className="issue-floating-card">

                <div className="issue-icon">
                  ⚠
                </div>

                <div>
                  <strong>Road damage</strong>
                  <small>
                    23 citizens supporting
                  </small>
                </div>

                <span className="priority">
                  82
                </span>

              </div>

              <div className="resolved-floating">

                <span>✓</span>

                <div>
                  <strong>Issue resolved</strong>
                  <small>
                    Streetlight · Sector 4
                  </small>
                </div>

              </div>

            </div>

            <div className="floating-number">
              <strong>3×</strong>

              <span>
                community
                <br />
                amplification
              </span>
            </div>

          </div>
        </section>

        {/* STATS */}

        <section className="stats">

          <div>
            <strong>01</strong>
            <span>Report problems</span>
          </div>

          <div>
            <strong>02</strong>
            <span>Build support</span>
          </div>

          <div>
            <strong>03</strong>
            <span>Reveal community impact</span>
          </div>

          <div>
            <strong>04</strong>
            <span>Get them resolved</span>
          </div>

        </section>

        {/* HOW IT WORKS */}

        <section
          className="how-section"
          id="how"
        >

          <div className="section-intro">

            <span className="section-label">
              THE CIVIFIX LOOP
            </span>

            <h2>
              Small reports.
              <br />
              <span>Collective impact.</span>
            </h2>

            <p>
              One citizen can spot a problem.
              A community can make sure it gets noticed.
            </p>

          </div>

          <div className="steps">

            <div className="step">
              <div className="step-number">01</div>
              <div className="step-icon">◉</div>

              <h3>Spot & report</h3>

              <p>
                Capture the problem, choose its category
                and let CiviFix attach the location automatically.
              </p>
            </div>

            <div className="step-line" />

            <div className="step">
              <div className="step-number">02</div>
              <div className="step-icon">↗</div>

              <h3>Community support</h3>

              <p>
                Citizens support existing issues instead
                of creating duplicate complaints.
              </p>
            </div>

            <div className="step-line" />

            <div className="step">
              <div className="step-number">03</div>
              <div className="step-icon">↑</div>

              <h3>Priority rises</h3>

              <p>
                More support means a stronger signal
                that the issue deserves attention.
              </p>
            </div>

            <div className="step-line" />

            <div className="step">
              <div className="step-number">04</div>
              <div className="step-icon">✓</div>

              <h3>Authority acts</h3>

              <p>
                Issues reach the relevant department
                and move toward resolution.
              </p>
            </div>

          </div>
        </section>

        {/* CTA */}

        <section className="bottom-cta">

          <div>

            <span className="section-label">
              MAKE SOMETHING BETTER
            </span>

            <h2>
              See a problem?
              <br />
              <em>Don't walk past it.</em>
            </h2>

          </div>

          <button
            className="primary-btn large light-btn"
            onClick={() => setPage('register')}
          >
            Join CiviFix
            <span className="arrow">↗</span>
          </button>

        </section>

        {/* FOOTER */}

        <footer>

          <div>
            <strong>CiviFix</strong>
            <span>
              Community-powered civic action.
            </span>
          </div>

          <span>
            © 2026 CiviFix
          </span>

        </footer>

      </main>
    </div>
  );
}


/* =========================
   NAVBAR
========================= */

function Navbar({
  user,
  onLogin,
  onRegister,
  onLogout,
  darkMode,
  toggleTheme
}) {
  return (
    <nav className="navbar">

      <div className="brand">

        <div className="brand-mark">
          <span />
          <span />
          <span />
        </div>

        <strong>
          Civi<span>Fix</span>
        </strong>

      </div>

      <div className="nav-links">
        <a href="#how">How it works</a>
        <a href="#community">Community</a>
      </div>

      <div className="nav-right">

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
        >
          <span className="theme-icon">
            {darkMode ? '☀' : '☾'}
          </span>

          <span className="theme-text">
            {darkMode ? 'Light' : 'Dark'}
          </span>
        </button>

        {user ? (
          <div className="nav-user">

            <span>{user.name}</span>

            <button onClick={onLogout}>
              Logout
            </button>

          </div>
        ) : (
          <div className="nav-actions">

            <button
              className="login-btn"
              onClick={onLogin}
            >
              Login
            </button>

            <button
              className="nav-cta"
              onClick={onRegister}
            >
              Get started <span>↗</span>
            </button>

          </div>
        )}

      </div>

    </nav>
  );
}


/* =========================
   ISSUE CARD
========================= */

function IssueCard({ issue }) {
  return (
    <article className="issue-card">

      <div className="issue-card-top">

        <span className="category">
          {issue.category || 'Civic issue'}
        </span>

        <span className="issue-id">
          #{issue.id}
        </span>

      </div>

      <h3>{issue.title}</h3>

      <p>
        {issue.department || 'Relevant authority'}
      </p>

      <div className="issue-card-bottom">

        <span>
          <strong>
            {issue.priority_score || 0}
          </strong>{' '}
          priority
        </span>

        <span>
          <strong>
            {issue.supporter_count || 0}
          </strong>{' '}
          supporters
        </span>

      </div>

    </article>
  );
}


/* =========================
   LOGIN
========================= */

function Login({
  onBack,
  onSuccess,
  darkMode,
  toggleTheme
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error || 'Login failed.'
        );
        return;
      }

      localStorage.setItem(
        'civifix_token',
        data.token
      );

      onSuccess(data.user);

    } catch {
      setError(
        'Could not connect to CiviFix.'
      );
    }
  }

  return (
    <div className="auth-page">

      <nav className="navbar">

        <div className="brand">

          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>

          <strong>
            Civi<span>Fix</span>
          </strong>

        </div>

        <div className="nav-right">

          <button
            className="theme-toggle"
            onClick={toggleTheme}
          >
            <span className="theme-icon">
              {darkMode ? '☀' : '☾'}
            </span>

            <span className="theme-text">
              {darkMode ? 'Light' : 'Dark'}
            </span>
          </button>

          <button
            className="login-btn"
            onClick={onBack}
          >
            ← Back
          </button>

        </div>

      </nav>

      <div className="auth-wrapper">

        <div className="auth-decoration">
          <div className="auth-orb" />
          <span>01</span>
          <span>02</span>
          <span>03</span>
        </div>

        <div className="auth-card">

          <span className="section-label">
            CIVIFIX
          </span>

          <h1>Welcome back.</h1>

          <p>
            Continue making your community better.
          </p>

          <form onSubmit={submit}>

            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={e =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button className="primary-btn full-btn">
              Login <span>↗</span>
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}


/* =========================
   REGISTER
========================= */

function Register({
  onBack,
  onSuccess,
  darkMode,
  toggleTheme
}) {
  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');

  function update(field, value) {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (
      data.password !==
      data.confirmPassword
    ) {
      setError(
        'Passwords do not match.'
      );
      return;
    }

    try {
      const res = await fetch(
        `${API}/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: data.password
          })
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setError(
          result.error ||
          'Registration failed.'
        );
        return;
      }

      localStorage.setItem(
        'civifix_token',
        result.token
      );

      onSuccess(result.user);

    } catch {
      setError(
        'Could not connect to CiviFix.'
      );
    }
  }

  return (
    <div className="auth-page">

      <nav className="navbar">

        <div className="brand">

          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>

          <strong>
            Civi<span>Fix</span>
          </strong>

        </div>

        <div className="nav-right">

          <button
            className="theme-toggle"
            onClick={toggleTheme}
          >
            <span className="theme-icon">
              {darkMode ? '☀' : '☾'}
            </span>

            <span className="theme-text">
              {darkMode ? 'Light' : 'Dark'}
            </span>
          </button>

          <button
            className="login-btn"
            onClick={onBack}
          >
            ← Back
          </button>

        </div>

      </nav>

      <div className="auth-wrapper">

        <div className="auth-decoration">
          <div className="auth-orb" />
          <span>01</span>
          <span>02</span>
          <span>03</span>
        </div>

        <div className="auth-card">

          <span className="section-label">
            CIVIFIX
          </span>

          <h1>Join CiviFix.</h1>

          <p>
            Your community needs people who care.
          </p>

          <form onSubmit={submit}>

            <label>Full name</label>

            <input
              value={data.name}
              onChange={e =>
                update('name', e.target.value)
              }
              placeholder="Your name"
              required
            />

            <label>Email</label>

            <input
              type="email"
              value={data.email}
              onChange={e =>
                update('email', e.target.value)
              }
              placeholder="you@example.com"
              required
            />

            <label>Phone</label>

            <input
              value={data.phone}
              onChange={e =>
                update('phone', e.target.value)
              }
              placeholder="9876543210"
            />

            <label>Password</label>

            <input
              type="password"
              value={data.password}
              onChange={e =>
                update(
                  'password',
                  e.target.value
                )
              }
              placeholder="Create a password"
              required
            />

            <label>
              Confirm password
            </label>

            <input
              type="password"
              value={data.confirmPassword}
              onChange={e =>
                update(
                  'confirmPassword',
                  e.target.value
                )
              }
              placeholder="Repeat your password"
              required
            />

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button className="primary-btn full-btn">
              Create account
              <span>↗</span>
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

createRoot(
  document.getElementById('root')
).render(<App />);