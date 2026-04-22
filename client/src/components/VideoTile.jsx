import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";

export const VideoTile = ({ label, stream, muted = false }) => {
  const videoRef = useRef(null);

  const initials = useMemo(() => {
    return label
      .split(" ")
      .map((chunk) => chunk[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [label]);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <article className={clsx("video-tile", { "video-tile--idle": !stream })}>
      <video ref={videoRef} className="video-element" autoPlay playsInline muted={muted} />
      {!stream ? <div className="video-tile__placeholder">{initials}</div> : null}
      <p className="video-tile__label">{label}</p>
    </article>
  );
};
