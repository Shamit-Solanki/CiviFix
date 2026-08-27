import React, { useEffect, useState } from 'react';

const API =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

const departments = [
  { id: 1, name: 'Roads & Transport' },
  { id: 2, name: 'Sanitation' },
  { id: 3, name: 'Water Supply' },
  { id: 4, name: 'Electricity' },
  { id: 5, name: 'Drainage' },
  { id: 6, name: 'Public Works' },
  { id: 7, name: 'Parks & Horticulture' },
  { id: 8, name: 'Street Lighting' },
  { id: 9, name: 'Municipal Corporation' },
  { id: 10, name: 'Other' }
];

export default function ReportIssue({ onBack }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    departmentId: '',
    severity: 3,
    imageUrl: ''
  });

  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] =
    useState('Detecting your location...');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus(
        'Geolocation is not supported by this browser'
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

        setLocationStatus(
          'Location detected automatically'
        );
      },
      () => {
        setLocationStatus(
          'Location permission is required'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }, []);

  function update(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function submit(e) {
    e.preventDefault();

    setError('');
    setResult(null);

    if (!location) {
      setError(
        'Please allow location access before submitting your report.'
      );
      return;
    }

    if (!form.departmentId) {
      setError(
        'Please select the authority responsible for this problem.'
      );
      return;
    }

    setLoading(true);

    try {
      const token =
        localStorage.getItem('civifix_token');

      if (!token) {
        setError(
          'Please log in before submitting a report.'
        );
        return;
      }

      const response = await fetch(
        `${API}/issues`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            departmentId: Number(form.departmentId),
            latitude: location.latitude,
            longitude: location.longitude,
            severity: Number(form.severity),
            imageUrl: form.imageUrl.trim() || null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
          'Could not submit the report.'
        );
        return;
      }

      setResult(data);

    } catch (err) {
      console.error(err);

      setError(
        'Could not connect to the CiviFix server.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     SUCCESS SCREEN
  ========================= */

  if (result) {
    const department =
      departments.find(
        d =>
          d.id === result.issue?.department_id
      )?.name || 'Selected authority';

    return (
      <div className="report-page">

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

          <button
            className="login-btn"
            onClick={onBack}
          >
            ← Back
          </button>

        </nav>

        <main className="report-success">

          <div className="success-icon">
            ✓
          </div>

          <span className="section-label">
            REPORT SUBMITTED
          </span>

          <h1>
            Your report is on its way.
          </h1>

          <p>
            CiviFix has recorded your issue and
            directed it toward the authority you selected.
          </p>

          <div className="success-card">

            <span>
              ISSUE #{result.issue?.id}
            </span>

            <strong>
              {result.issue?.title}
            </strong>

            <small>
              Assigned authority: {department}
            </small>

            <small>
              Status: {result.issue?.status || 'REPORTED'}
            </small>

          </div>

          {result.possibleDuplicate && (
            <div className="duplicate-notice">

              <strong>
                A nearby related issue may already exist.
              </strong>

              <p>
                CiviFix found issue #
                {result.possibleDuplicate.id}
                {' '}near this location.
              </p>

              <p>
                You can support that issue from the
                community dashboard instead of creating
                unnecessary duplicate reports.
              </p>

            </div>
          )}

          <button
            className="primary-btn large"
            onClick={onBack}
          >
            Return to dashboard
            <span>↗</span>
          </button>

        </main>

      </div>
    );
  }

  /* =========================
     REPORT FORM
  ========================= */

  return (
    <div className="report-page">

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

        <button
          className="login-btn"
          onClick={onBack}
        >
          ← Back
        </button>

      </nav>

      <main className="report-container">

        <div className="report-heading">

          <span className="section-label">
            CIVIC REPORT
          </span>

          <h1>
            What's happening?
          </h1>

          <p>
            Tell us about a problem in your community.
            CiviFix will connect your report with the
            authority that can act on it.
          </p>

        </div>

        <form
          className="report-form"
          onSubmit={submit}
        >

          {/* 01 — PROBLEM */}

          <div className="form-section">

            <div className="form-section-heading">

              <span>01</span>

              <div>
                <h2>Describe the problem</h2>

                <p>
                  Explain what you saw in your own words.
                </p>
              </div>

            </div>

            <label>
              Problem title
            </label>

            <input
              type="text"
              value={form.title}
              onChange={e =>
                update('title', e.target.value)
              }
              placeholder="e.g. Large pothole outside Block C"
              maxLength="150"
              required
            />

            <label>
              Description
            </label>

            <textarea
              value={form.description}
              onChange={e =>
                update(
                  'description',
                  e.target.value
                )
              }
              placeholder="Describe the problem, its location, and how it is affecting people..."
              rows="6"
              maxLength="2000"
            />

          </div>


          {/* 02 — AUTHORITY */}

          <div className="form-section">

            <div className="form-section-heading">

              <span>02</span>

              <div>
                <h2>Choose the responsible authority</h2>

                <p>
                  Point your report toward the department
                  that should handle the problem.
                </p>
              </div>

            </div>

            <label>
              Target authority
            </label>

            <select
              value={form.departmentId}
              onChange={e =>
                update(
                  'departmentId',
                  e.target.value
                )
              }
              required
            >

              <option value="">
                Select an authority
              </option>

              {departments.map(department => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}

            </select>

          </div>


          {/* 03 — LOCATION */}

          <div className="form-section">

            <div className="form-section-heading">

              <span>03</span>

              <div>
                <h2>Confirm location</h2>

                <p>
                  Your location is captured automatically
                  to help identify exactly where the problem is.
                </p>
              </div>

            </div>

            <div
              className={
                location
                  ? 'location-box detected'
                  : 'location-box'
              }
            >

              <div className="location-icon">
                {location ? '✓' : '⌖'}
              </div>

              <div>

                <strong>
                  {locationStatus}
                </strong>

                {location && (
                  <small>
                    {location.latitude.toFixed(6)}
                    {' · '}
                    {location.longitude.toFixed(6)}
                  </small>
                )}

              </div>

            </div>

          </div>


          {/* 04 — SEVERITY */}

          <div className="form-section">

            <div className="form-section-heading">

              <span>04</span>

              <div>
                <h2>How serious is it?</h2>

                <p>
                  Your assessment is one signal used
                  when determining issue priority.
                </p>
              </div>

            </div>

            <div className="severity-options">

              {[1, 2, 3, 4, 5].map(level => (

                <button
                  type="button"
                  key={level}
                  className={
                    Number(form.severity) === level
                      ? 'severity-option selected'
                      : 'severity-option'
                  }
                  onClick={() =>
                    update('severity', level)
                  }
                >

                  <strong>
                    {level}
                  </strong>

                  <span>
                    {level === 1 && 'Minor'}
                    {level === 2 && 'Low'}
                    {level === 3 && 'Moderate'}
                    {level === 4 && 'Serious'}
                    {level === 5 && 'Critical'}
                  </span>

                </button>

              ))}

            </div>

          </div>


          {/* 05 — PHOTO */}

          <div className="form-section">

            <div className="form-section-heading">

              <span>05</span>

              <div>
                <h2>Add evidence</h2>

                <p>
                  A photo can help authorities understand
                  the issue faster.
                </p>
              </div>

            </div>

            <label>
              Image URL
            </label>

            <input
              type="url"
              value={form.imageUrl}
              onChange={e =>
                update(
                  'imageUrl',
                  e.target.value
                )
              }
              placeholder="Paste an image URL for now"
            />

            <div className="photo-input">

              <div className="photo-icon">
                +
              </div>

              <div>

                <strong>
                  Photo upload coming next
                </strong>

                <small>
                  We'll connect CiviFix to image storage
                  after the core reporting flow works.
                </small>

              </div>

            </div>

          </div>


          {/* SUBMIT */}

          <div className="report-submit">

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              className="primary-btn large"
              type="submit"
              disabled={loading}
            >

              {loading
                ? 'Submitting...'
                : 'Submit report'}

              <span>
                {loading ? '...' : '↗'}
              </span>

            </button>

            <small>
              CiviFix uses community signals to help
              identify which civic problems need attention.
            </small>

          </div>

        </form>

      </main>

    </div>
  );
}