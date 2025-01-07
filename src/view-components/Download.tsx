import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "react-hot-toast";
import { listen } from "@tauri-apps/api/event";
import { genId } from "../lib/utils";
import useDisableScroll from "../hooks/disableScroll";
import "../styles/Download.css";
import "../styles/App.css";

type VideoValidation = {
  success: boolean;
  content: string;
};
type StreamValidation =
  | { success: true; content: Uint8Array }
  | { success: false; content: string };

function DownloadComp() {
  useDisableScroll(true);

  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const downloadIds: { [key: string]: string } = {};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.currentTarget.value;

    if (newValue === "biogg.net") {
      window.location.href = "https://biogg.net";
      return;
    }

    setError("");
    setUrl(newValue);
  };

  listen("progress", (event) => {
    const update = (toastId: string, message: string) => {
      toast.loading(message, {
        id: toastId,
      });
    };

    const payload = event.payload as String;
    const [toastId, message] = payload.split(" ");
    switch (message) {
      case "downloading":
        update(toastId, "Downloading...");
        break;
      case "sendingdata":
        update(toastId, "Sending Data...");
        break;
      case "processing":
        update(toastId, "Processing...");
        break;
    }
  });

  async function download() {
    const downloadId = genId();

    const toastId = toast.loading("Getting Info...", {
      style: {
        borderRadius: "8px",
        background: "#444",
        color: "#fff",
      },
    });

    downloadIds[downloadId] = downloadId;

    const convertResult = await convert(downloadId, toastId);

    delete downloadIds[downloadId];

    const unlinkResult = await unlinkTempFiles([
      downloadId,
      downloadId + "v",
      downloadId + "a",
    ]);

    if (unlinkResult.success === false) {
      setError(unlinkResult.content);
      toast.error(unlinkResult.content, {
        style: {
          borderRadius: "8px",
          background: "#444",
          color: "#fff",
        },
      });
    }

    if (convertResult !== undefined) {
      toast.success("Download completed!", {
        id: toastId,
      });
    }
  }

  async function convert(downloadId: string, toastId: string) {
    const { success: videoInfoSuccess, content: videoInfo } =
      await getVideoInfo(url);

    if (videoInfoSuccess === false) {
      setError(videoInfo);
      toast.error(videoInfo, {
        id: toastId,
      });
      return;
    }

    const { success: bestVideoSuccess, content: bestVideo } =
      await getBestVideo(videoInfo);

    if (bestVideoSuccess === false) {
      setError(bestVideo);
      toast.error(bestVideo, {
        id: toastId,
      });
      return;
    }

    const { success: bestAudioSuccess, content: bestAudio } =
      await getBestAudio(videoInfo);

    if (bestAudioSuccess === false) {
      setError(bestAudio);
      toast.error(bestAudio, {
        id: toastId,
      });
      return;
    }

    toast.loading("Downloading...", {
      id: toastId,
    });

    const bestVideoId = JSON.parse(bestVideo).format_id;
    const bestAudioId = JSON.parse(bestAudio).format_id;

    if (bestVideoId === bestAudioId) {
      const { success: videoBytesSuccess, content: videoBytes } =
        await downloadStream(url, bestVideoId, downloadId);

      if (videoBytesSuccess === false) {
        setError(videoBytes);
        toast.error(videoBytes, {
          id: toastId,
        });
        return;
      }

      toast.loading("Validating...", {
        id: toastId,
      });

      const { success: videoValidSuccess, content: videoValid } =
        await validateData(downloadId);

      if (videoValidSuccess === false) {
        setError(videoValid);
        toast.error(videoValid, {
          id: toastId,
        });
        return;
      }

      toast.loading("Remuxing...", {
        id: toastId,
      });

      const { success: mergeSuccess, content: mergeContent } = await merge(
        downloadId,
        downloadId,
        downloadId,
      );

      if (mergeSuccess === false) {
        setError(mergeContent);
        toast.error(mergeContent, {
          id: toastId,
        });
        return;
      }
    } else {
      const [videoResponse, audioResponse] = await Promise.all([
        downloadStream(url, JSON.parse(bestVideo).format_id, downloadId, "v"),
        downloadStream(url, JSON.parse(bestAudio).format_id, downloadId, "a"),
      ]);

      const { success: videoBytesSuccess, content: videoBytes } = videoResponse;

      const { success: audioBytesSuccess, content: audioBytes } = audioResponse;

      if (videoBytesSuccess === false) {
        setError(videoBytes);
        toast.error(videoBytes, {
          id: toastId,
        });
        return;
      }

      if (audioBytesSuccess === false) {
        setError(audioBytes);
        toast.error(audioBytes, {
          id: toastId,
        });
        return;
      }

      console.log(videoBytes.length, audioBytes.length);

      toast.loading("Validating...", {
        id: toastId,
      });

      const [videoValidation, audioValidation] = await Promise.all([
        validateData(downloadId, "v"),
        validateData(downloadId, "a"),
      ]);

      const { success: videoValidSuccess, content: videoValid } =
        videoValidation;

      const { success: audioValidSuccess, content: audioValid } =
        audioValidation;

      if (videoValidSuccess === false) {
        setError(videoValid);
        toast.error(videoValid, {
          id: toastId,
        });
        return;
      }

      if (audioValidSuccess === false) {
        setError(audioValid);
        toast.error(audioValid, {
          id: toastId,
        });
        return;
      }

      toast.loading("Merging...", {
        id: toastId,
      });

      const { success: mergeSuccess, content: mergeBytes } = await merge(
        downloadId + "v",
        downloadId + "a",
        downloadId,
      );

      if (mergeSuccess === false) {
        setError(mergeBytes);
        toast.error(mergeBytes, {
          id: toastId,
        });
        return;
      }
    }

    return true;
  }

  async function merge(video: string, audio: string, downloadId: string) {
    const result: VideoValidation = await invoke("merge", {
      video,
      audio,
      downloadId,
    });
    return result;
  }

  async function unlinkTempFiles(filenames: string[]) {
    const result: VideoValidation = await invoke("unlink_temp_files", {
      filenames,
    });
    return result;
  }

  async function validateData(downloadId: string, queueExt: string = "") {
    const result: VideoValidation = await invoke("validate_data", {
      downloadId,
      queueExt,
    });
    return result;
  }

  async function downloadStream(
    url: string,
    formatId: string,
    downloadId: string,
    queueExt: string = "",
  ) {
    const result: StreamValidation = await invoke("download_stream", {
      url,
      formatId,
      downloadId,
      queueExt,
    });
    return result;
  }

  async function getVideoInfo(url: string): Promise<VideoValidation> {
    const result: VideoValidation = await invoke("get_video_info", { url });
    return result;
  }

  async function getBestVideo(jsonString: string): Promise<VideoValidation> {
    const result: VideoValidation = await invoke("get_best_video", {
      jsonString,
    });
    return result;
  }

  async function getBestAudio(jsonString: string): Promise<VideoValidation> {
    const result: VideoValidation = await invoke("get_best_audio", {
      jsonString,
    });
    return result;
  }

  return (
    <div className="download-container">
      <form
        className="download-row"
        onSubmit={(e) => {
          e.preventDefault();
          download();
        }}
      >
        <div className="input-wrapper">
          <input
            id="url-input"
            onChange={handleInputChange}
            placeholder={"Paste the Video URL..."}
            style={error ? { borderColor: "red", color: "red" } : {}}
          />
          <button className="convert-button" type="submit">
            Convert
          </button>
        </div>
      </form>
      <form>
        <div className="selection-wrapper">
          <button className="auto-button" type="button">
            Auto
          </button>
          <button className="video-button" type="button">
            Video
          </button>
          <button className="audio-button" type="button">
            Audio
          </button>
        </div>
      </form>
      <main className="downloadbar-container">
        <p>Download Videos or MP3's from many Platforms</p>
      </main>
    </div>
  );
}

export default DownloadComp;
