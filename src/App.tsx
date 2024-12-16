import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { listen } from "@tauri-apps/api/event";

function App() {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.currentTarget.value;

        if (newValue === "biogg.net") {
            window.location.href = "https://biogg.net";
            return;
        }

        setUrl(newValue);
    };

    listen("progress", (event) => {
        const update = (toastId: string, message: string) => {
            toast.loading(message, {
                id: toastId, // Bestehendes Toast aktualisieren
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
        const loadingToastId = toast.loading("Starting...", {
            style: {
                borderRadius: "8px",
                background: "#333",
                color: "#fff",
            },
        }); 
    
        try {
            const result = await invoke("submit", { 
                url, 
                format: "mp4", 
                toastId: loadingToastId 
            });

            if (!result) {
                throw new Error("Failed to reach the platform");
            }

            toast.dismiss(loadingToastId);
            toast.success("Download completed!", {
                style: {
                    borderRadius: "8px",
                    background: "#333",
                    color: "#fff",
                },
            });
        } catch (error) {
            console.error(error)
            toast.dismiss(loadingToastId);
            toast.error("An error occurred or platform could not be reached.", {
                style: {
                    borderRadius: "8px",
                    background: "#333",
                    color: "#fff",
                },
            });
        }
    }



    function validateUrl() {
        return true
        const youtubeRegex = /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/;
        const tiktokRegex = /^https:\/\/(www\.)?tiktok\.com\/[\@\w.-]+\/video\/\d+$/;
        const instagramRegex = /^https:\/\/(www\.)?instagram\.com\/p\/[\w-]+\/$/;
        const redditRegex = /^https:\/\/(www\.)?reddit\.com\/r\/[\w-]+\/comments\/[\w-]+\//;
        const xRegex = /^https:\/\/(www\.)?x\.com\/[\@\w.-]+\/status\/\d+$/;

        if (youtubeRegex.test(url)) return true;
        if (tiktokRegex.test(url)) return true;
        if (instagramRegex.test(url)) return true;
        if (redditRegex.test(url)) return true;
        if (xRegex.test(url)) return true;

        setError("This is not a valid video link for a supported platform.");
            toast.error("This is not a valid video link for a supported platform.", {
                style: {
                    borderRadius: "8px",
                    background: "#333",
                    color: "#fff",
                },
            });
        return false;
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
                        if (validateUrl()) {
                            convert();
                        }
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
