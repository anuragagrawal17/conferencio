import { useEffect, useState } from "react";
import { ConferenceView } from "./components/ConferenceView";
import { JoinForm } from "./components/JoinForm";
import { useConference } from "./hooks/useConference";

const App = () => {
  const conference = useConference();
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    if (conference.status === "idle") {
      setActiveSession(null);
    }
  }, [conference.status]);

  const handleJoin = async ({ roomId, displayName }) => {
    const didJoin = await conference.joinConference(roomId, displayName);

    if (didJoin) {
      setActiveSession({
        roomId: roomId.trim(),
        displayName: displayName.trim()
      });
    }
  };

  return (
    <main className="app-shell">
      {!activeSession ? (
        <JoinForm
          onJoin={handleJoin}
          isJoining={conference.status === "joining"}
          error={conference.error}
        />
      ) : (
        <ConferenceView
          roomId={activeSession.roomId}
          displayName={activeSession.displayName}
          localStream={conference.localStream}
          remoteParticipants={conference.remoteParticipants}
          remoteStreams={conference.remoteStreams}
          isAudioEnabled={conference.isAudioEnabled}
          isVideoEnabled={conference.isVideoEnabled}
          error={conference.error}
          onToggleAudio={conference.toggleAudio}
          onToggleVideo={conference.toggleVideo}
          onLeave={conference.leaveConference}
        />
      )}
    </main>
  );
};

export default App;
