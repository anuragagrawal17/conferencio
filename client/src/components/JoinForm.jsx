import { useMemo, useState } from "react";

const generateRoomId = () => {
  return `room-${Math.random().toString(36).slice(2, 8)}`;
};

export const JoinForm = ({ onJoin, isJoining, error }) => {
  const [roomId, setRoomId] = useState(generateRoomId);
  const [displayName, setDisplayName] = useState("");

  const canSubmit = useMemo(() => {
    return roomId.trim().length > 0 && displayName.trim().length > 0;
  }, [displayName, roomId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onJoin({ roomId, displayName });
  };

  return (
    <section className="panel join-card">
      <p className="brand-mark">CONFERENCIO</p>
      <h1 className="join-title">Real-time conferencing for focused collaboration</h1>
      <p className="join-subtitle">
        Create a room key, share it, and start talking with low-friction video sessions.
      </p>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          className="text-input"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Alex Mercer"
          maxLength={40}
          autoComplete="off"
          required
        />

        <label className="field-label" htmlFor="roomId">
          Room key
        </label>
        <div className="inline-row">
          <input
            id="roomId"
            className="text-input"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            maxLength={64}
            autoComplete="off"
            required
          />
          <button
            type="button"
            className="ghost-button"
            onClick={() => setRoomId(generateRoomId())}
            disabled={isJoining}
          >
            Regenerate
          </button>
        </div>

        <button type="submit" className="primary-button" disabled={!canSubmit || isJoining}>
          {isJoining ? "Joining..." : "Join Conferencio"}
        </button>
      </form>

      {error ? <p className="error-banner">{error}</p> : null}
    </section>
  );
};
