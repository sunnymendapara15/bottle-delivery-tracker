import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:5041';
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });

function App() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [formDate, setFormDate] = useState('');
  const [formCount, setFormCount] = useState('');
  const [formStatus, setFormStatus] = useState({ message: '', type: '' });
  const [fetchError, setFetchError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    setFormDate(new Date().toISOString().split('T')[0]);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsFetching(true);
      const deliveriesRes = await fetch(`${API_BASE}/api/deliveries`);
      if (!deliveriesRes.ok) {
        throw new Error('Unable to load delivery records.');
      }

      const summaryRes = await fetch(`${API_BASE}/api/monthly-summary`);
      if (!summaryRes.ok) {
        throw new Error('Unable to load the monthly summary.');
      }

      const deliveriesData = await deliveriesRes.json();
      const summaryData = await summaryRes.json();

      setEntries(deliveriesData);
      setSummary(summaryData);
      setFetchError('');
    } catch (error) {
      setFetchError(error.message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormStatus({ message: '', type: '' });

    if (!formDate) {
      setFormStatus({ message: 'Please select a delivery date.', type: 'error' });
      return;
    }

    const parsedCount = Number(formCount);
    if (!parsedCount || parsedCount <= 0) {
      setFormStatus({ message: 'Enter a positive number of bottles.', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE}/api/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: formDate, count: parsedCount }),
      });

      let errorPayload;
      try {
        errorPayload = await response.json();
      } catch {
        errorPayload = null;
      }

      if (!response.ok) {
        throw new Error(errorPayload?.error ?? 'Unable to save delivery.');
      }

      setFormStatus({ message: 'Delivery saved successfully.', type: 'success' });
      setFormCount('');
      await fetchData();
    } catch (error) {
      setFormStatus({ message: error.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMonthEntry = useMemo(() => {
    const now = new Date();
    return summary.find(
      (row) => row.year === now.getFullYear() && row.month === now.getMonth() + 1
    );
  }, [summary]);

  const totalBottles = useMemo(
    () =>
      summary.reduce((acc, row) => {
        return acc + (row.totalBottles ?? 0);
      }, 0),
    [summary]
  );

  const formatMonthYear = (year, month) => `${monthFormatter.format(new Date(year, month - 1))} ${year}`;

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">Vendor delivery log</p>
        <h1>Bottle delivery tracker</h1>
        <p className="description">
          Record daily drop-offs and review monthly totals to streamline vendor payments.
        </p>
        {fetchError && <div className="status error">{fetchError}</div>}
      </header>

      <section className="grid">
        <article className="panel">
          <h2>Log a delivery</h2>
          <p className="helper">Update the count for any day; duplicate dates overwrite the previous count.</p>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Date</span>
              <input
                className="input"
                type="date"
                value={formDate}
                onChange={(event) => setFormDate(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Number of bottles</span>
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                placeholder="e.g., 25"
                inputMode="numeric"
                value={formCount}
                onChange={(event) => setFormCount(event.target.value)}
              />
            </label>

            <button type="submit" disabled={isSubmitting || isFetching}>
              {isSubmitting ? 'Saving…' : 'Save delivery'}
            </button>
          </form>

          {formStatus.message && <div className={`status ${formStatus.type}`}>{formStatus.message}</div>}
        </article>

        <article className="panel">
          <h2>Monthly summary</h2>
          <p className="helper">Reviewed counts are grouped per calendar month.</p>

          {summary.length === 0 ? (
            <p className="helper">No deliveries logged yet.</p>
          ) : (
            <div className="summary-grid">
              {summary.map((row) => (
                <article key={`${row.year}-${row.month}`} className="summary-card">
                  <p className="summary-label">{formatMonthYear(row.year, row.month)}</p>
                  <p className="summary-value">{row.totalBottles}</p>
                </article>
              ))}
            </div>
          )}

          <div className="summary-footer">
            <p>
              Current month
              <strong> {currentMonthEntry ? currentMonthEntry.totalBottles : 0} bottles</strong>
            </p>
            <p>
              All time
              <strong> {totalBottles}</strong>
            </p>
          </div>

          {isFetching && <p className="helper">Refreshing totals…</p>}
        </article>
      </section>

      <section className="panel table-panel">
        <h2>Recent deliveries</h2>
        {isFetching && entries.length === 0 ? (
          <p className="helper">Loading deliveries…</p>
        ) : entries.length === 0 ? (
          <p className="helper">No records yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bottles</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.deliveredOn}</td>
                    <td>{entry.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
