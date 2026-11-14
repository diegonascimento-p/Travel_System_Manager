export function ConnectCalendar({ connecting, onConnect }) {
  return (
    <section className="connect">
      <p>Connect your Google Calendar to see your saved events and their locations.</p>
      <button type="button" onClick={onConnect} disabled={connecting}>
        {connecting ? 'Connecting…' : 'Connect Google Calendar'}
      </button>
    </section>
  );
}
