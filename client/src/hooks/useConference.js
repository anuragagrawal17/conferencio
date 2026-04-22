import { useCallback, useMemo, useRef, useState } from "react";
import Peer from "simple-peer";
import { createSocket } from "../lib/socket";

const stopMediaStream = (stream) => {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => {
    track.stop();
  });
};

const toParticipantRegistry = (participants) => {
  return participants.reduce((registry, participant) => {
    registry[participant.socketId] = participant;
    return registry;
  }, {});
};

export const useConference = () => {
  const socketRef = useRef(null);
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const removePeer = useCallback((socketId) => {
    const peer = peersRef.current.get(socketId);

    if (peer) {
      peer.removeAllListeners();
      peer.destroy();
      peersRef.current.delete(socketId);
    }

    setRemoteStreams((previous) => {
      const next = { ...previous };
      delete next[socketId];
      return next;
    });
  }, []);

  const teardownConnection = useCallback(
    (resetView) => {
      peersRef.current.forEach((peer) => {
        peer.removeAllListeners();
        peer.destroy();
      });
      peersRef.current.clear();

      if (socketRef.current) {
        socketRef.current.emit("room:leave");
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;

      setLocalStream(null);
      setParticipants({});
      setRemoteStreams({});

      if (resetView) {
        setStatus("idle");
        setError(null);
        setIsAudioEnabled(true);
        setIsVideoEnabled(true);
      }
    },
    []
  );

  const createPeer = useCallback(
    (targetSocketId, initiator) => {
      const existingPeer = peersRef.current.get(targetSocketId);

      if (existingPeer) {
        return existingPeer;
      }

      if (!localStreamRef.current || !socketRef.current) {
        return null;
      }

      const peer = new Peer({
        initiator,
        trickle: true,
        stream: localStreamRef.current
      });

      peer.on("signal", (signal) => {
        socketRef.current?.emit("signal:forward", {
          targetSocketId,
          signal
        });
      });

      peer.on("stream", (stream) => {
        setRemoteStreams((previous) => ({
          ...previous,
          [targetSocketId]: stream
        }));
      });

      peer.on("close", () => {
        removePeer(targetSocketId);
      });

      peer.on("error", () => {
        removePeer(targetSocketId);
      });

      peersRef.current.set(targetSocketId, peer);
      return peer;
    },
    [removePeer]
  );

  const leaveConference = useCallback(() => {
    teardownConnection(true);
  }, [teardownConnection]);

  const joinConference = useCallback(
    async (roomId, displayName) => {
      const normalizedRoomId = roomId.trim();
      const normalizedDisplayName = displayName.trim();

      if (!normalizedRoomId || !normalizedDisplayName) {
        setStatus("error");
        setError("Room and display name are required.");
        return false;
      }

      teardownConnection(true);
      setStatus("joining");
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        localStreamRef.current = stream;
        setLocalStream(stream);

        const socket = createSocket();
        socketRef.current = socket;

        socket.on("connect_error", () => {
          teardownConnection(false);
          setStatus("error");
          setError("Unable to connect to the signaling server.");
        });

        socket.on("disconnect", (reason) => {
          if (reason === "io client disconnect") {
            return;
          }

          teardownConnection(false);
          setStatus("error");
          setError("Connection lost.");
        });

        socket.on("room:error", (payload) => {
          teardownConnection(false);
          setStatus("error");
          setError(payload.message);
        });

        socket.on("room:state", ({ self, peers }) => {
          const selfParticipant = {
            socketId: self.socketId,
            displayName: self.displayName,
            isSelf: true
          };

          const peerParticipants = peers.map((peer) => ({
            socketId: peer.socketId,
            displayName: peer.displayName
          }));

          setParticipants(toParticipantRegistry([selfParticipant, ...peerParticipants]));

          peers.forEach((peer) => {
            createPeer(peer.socketId, true);
          });

          setStatus("joined");
        });

        socket.on("room:peer-joined", (peer) => {
          setParticipants((previous) => ({
            ...previous,
            [peer.socketId]: {
              socketId: peer.socketId,
              displayName: peer.displayName
            }
          }));
        });

        socket.on("room:peer-left", ({ socketId }) => {
          removePeer(socketId);

          setParticipants((previous) => {
            const next = { ...previous };
            delete next[socketId];
            return next;
          });
        });

        socket.on("signal:incoming", ({ fromSocketId, signal }) => {
          const existingPeer = peersRef.current.get(fromSocketId);
          const peer = existingPeer ?? createPeer(fromSocketId, false);

          if (!peer) {
            return;
          }

          peer.signal(signal);
        });

        socket.emit("room:join", {
          roomId: normalizedRoomId,
          displayName: normalizedDisplayName
        });

        return true;
      } catch (joinError) {
        teardownConnection(true);
        setStatus("error");
        setError(joinError instanceof Error ? joinError.message : "Unable to join conference.");
        return false;
      }
    },
    [createPeer, removePeer, teardownConnection]
  );

  const toggleAudio = useCallback(() => {
    const nextState = !isAudioEnabled;

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextState;
    });

    setIsAudioEnabled(nextState);
  }, [isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    const nextState = !isVideoEnabled;

    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextState;
    });

    setIsVideoEnabled(nextState);
  }, [isVideoEnabled]);

  const remoteParticipants = useMemo(() => {
    return Object.values(participants).filter((participant) => !participant.isSelf);
  }, [participants]);

  return {
    status,
    error,
    localStream,
    participants,
    remoteParticipants,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    joinConference,
    leaveConference,
    toggleAudio,
    toggleVideo
  };
};
