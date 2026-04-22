import { useState } from "react";
import { VideoTile } from "./VideoTile";

export const ConferenceView = ({
  roomId,
  displayName,
  localStream,
  remoteParticipants,
  remoteStreams,
  isAudioEnabled,
  isVideoEnabled,
  error,
  onToggleAudio,
  onToggleVideo,
  onLeave
}) => {
  const [copied, setCopied] = useState(false);

  const copyRoomKey = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="panel conference-card">
      <header className="conference-topbar">
        <div>
          <p className="conference-title">Conferencio room</p>
          <p className="room-chip">{roomId}</p>
        </div>

        <div className="topbar-actions">
          <button type="button" className="ghost-button" onClick={copyRoomKey}>
            {copied ? "Copied" : "Copy room key"}
          </button>
          <button
            type="button"
            className={isAudioEnabled ? "control-button" : "control-button off"}
            onClick={onToggleAudio}
          >
            {isAudioEnabled ? "Mute" : "Unmute"}
          </button>
          <button
            type="button"
            className={isVideoEnabled ? "control-button" : "control-button off"}
            onClick={onToggleVideo}
          >
            {isVideoEnabled ? "Stop video" : "Start video"}
          </button>
          <button type="button" className="danger-button" onClick={onLeave}>
            Leave
          </button>
        </div>
      </header>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="video-grid">
        <VideoTile label={`${displayName} (You)`} stream={localStream} muted />
        {remoteParticipants.map((participant) => (
          <VideoTile
            key={participant.socketId}
            label={participant.displayName}
            stream={remoteStreams[participant.socketId] ?? null}
          />
        ))}
      </div>

      {remoteParticipants.length === 0 ? (
        <p className="empty-state">Waiting for other participants to join this room.</p>
      ) : null}
    </section>
  );
};
