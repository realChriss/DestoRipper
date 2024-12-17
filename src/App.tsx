import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { listen } from "@tauri-apps/api/event";

type VideoValidation = {
    success: boolean, 
    content: string
}
type StreamValidation = 
  | { success: true; content: number[] }
  | { success: false; content: string };

function App() {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.currentTarget.value;

        if (newValue === "biogg.net") {
            window.location.href = "https://biogg.net";
            return;
        }

        setError("")
        setUrl(newValue);
    };

    listen("progress", (event) => {
        const update = (toastId: string, message: string) => {
            toast.loading(message, {
                id: toastId,
                style: {
                    borderRadius: "8px",
                    background: "#333",
                    color: "#fff",
                },
            });
        }

        const payload = event.payload as String
        const [toastId, message] = payload.split(" ");
        switch (message) {
            case "downloading":
                update(toastId, "Downloading...")
                break
            case "processing":
                update(toastId, "Processing...")
                break
        }
    })

    async function convert() {
        const loadingToastId = toast.loading("Validating...", {
            style: {
                borderRadius: "8px",
                background: "#333",
                color: "#fff",
            },
        }); 

        const { 
            success: videoInfoSuccess, 
            content: videoInfo
        } = await getVideoInfo(url)

        if (videoInfoSuccess === false) {
            setError(videoInfo);
            toast.error(videoInfo, {
                id: loadingToastId,
                style: {
                    borderRadius: "8px",
                    background: "#333",
                    color: "#fff",
                },
            });
            return
        } 
        
        const { 
            success: bestVideoSuccess, 
            content: bestVideo
        } = await getBestVideo(videoInfo)

        if (bestVideoSuccess === false) {
            setError(bestVideo);
            toast.error(bestVideo, {
                id: loadingToastId,
                style: {
                    borderRadius: "8px",
                    background: "#333",
                    color: "#fff",
                },
            });
            return
        } 

        console.log(bestVideo)

        const { 
            success: videoBytesSuccess, 
            content: videoBytes
        } = await downloadStream(url, JSON.parse(bestVideo).format_id)

        if (videoBytesSuccess === false) {
            setError(videoBytes);
            toast.error(videoBytes, {
                id: loadingToastId,
                style: {
                    borderRadius: "8px",
                    background: "#333",
                    color: "#fff",
                },
            });
            return
        } 

        console.log(videoBytes.length)
        return

        const { 
            success: bestAudioSuccess, 
            content: bestAudio
        } = await getBestAudio(videoInfo)

        if (bestAudioSuccess === false) {
            setError(bestAudio);
            toast.error(bestAudio, {
                id: loadingToastId,
                style: {
                    borderRadius: "8px",
                    background: "#333",
                    color: "#fff",
                },
            });
            return
        } 

        
        
        try {
            const result = await invoke("submit", { 
                url, 
                format: "mp4", 
                toastId: loadingToastId 
            });

            if (!result) {
                throw new Error("Failed to reach the platform");
            }

            toast.success("Download completed!", {
                id: loadingToastId,
                style: {
                    borderRadius: "8px",
                    background: "#333",
                    color: "#fff",
                },
            });
        } catch (error) {
            console.error(error)
            toast.error("An error occurred or platform could not be reached.", {
                id: loadingToastId,
                style: {
                    borderRadius: "8px",
                    background: "#333",
                    color: "#fff",
                },
            });
        }
    }

    async function downloadStream(url: string, formatId: string) {
        const result: StreamValidation = await invoke("download_stream", { url, formatId });
        return result
    }

    async function getVideoInfo(url: string): Promise<VideoValidation> {
        const result: VideoValidation = await invoke("get_video_info", { url });
        return result
    }

    async function getBestVideo(jsonString: string): Promise<VideoValidation> {
        const result: VideoValidation = await invoke("get_best_video", { jsonString });
        return result
    }

    async function getBestAudio(jsonString: string): Promise<VideoValidation> {
        const result: VideoValidation = await invoke("get_best_audio", { jsonString });
        return result
    }

    return (
        <div className="app-container">
            <header className="header">
                <h1>Desto Ripper</h1>
            </header>
            <main className="container">
                <p>Download Videos or MP3's from many Platforms</p>

                <form
                    className="row"
                    onSubmit={(e) => {
                        e.preventDefault();
                        convert();
                    }}
                >
                    <div className="input-container">
                        <input
                            id="url-input"
                            onChange={handleInputChange}
                            placeholder={"Paste the Video URL..."}
                            style={error ? { borderColor: "red", color: "red" } : {}}
                        />
                    </div>
                    <button type="submit">Convert</button>
                </form>
                <Toaster />
                <form>
                    <h2 className="PlatformSupportH2">Platforms we Support:</h2>
                    <div className="platformsIMG">
                        <svg
                            className="ytIMG"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 576 512"
                        >
                            <path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z" />
                        </svg>
                        <img
                            className="ttIMG"
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw2AHEa003m1a2SgHiCuL3NHMzcLkkQsUEVA&s"
                            alt="TikTok"
                        />
                        <img
                            className="igIMG"
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTK5zQ42vVBoRGGYD7A6pKnIIRAT_G-cFVZbA&s"
                            alt="Instagram"
                        />
                    </div>
                </form>
            </main>
            <footer className="footer">
                <p>&copy; 2025 Desto.lol. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default App;
