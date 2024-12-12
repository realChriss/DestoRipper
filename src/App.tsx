import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import React from "react";
import { Toaster, toast } from "react-hot-toast";

function App() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [displayedUrl, setDisplayedUrl] = useState("");
  const typingTimeoutRef = useRef<number | undefined>();
  const isTypingRef = useRef(false);

  useEffect(() => {
    let intervalId: number | undefined;

    if (url.length > 15 && !isTypingRef.current) {
      intervalId = window.setInterval(() => {
        setDisplayedUrl((prev) => {
          const spacedUrl = ` ${prev} `;
          return spacedUrl.substring(1) + spacedUrl[0];
        });
      }, 50);
    } else {
      setDisplayedUrl(url);
    }

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [url, isTypingRef.current]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;
    setUrl(newValue);
    setDisplayedUrl(newValue);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    isTypingRef.current = true;

    typingTimeoutRef.current = window.setTimeout(() => {
      isTypingRef.current = false;
    }, 3000); 
  };

  async function convert() {
    toast.loading("Download is starting...", {
      style: {
        borderRadius: '8px',
        background: '#333',
        color: '#fff',
      },
    });
    await invoke("submit", { url, format: "mp4" });
    toast.success("Download completed!"), {
      style: {
        borderRadius: '8px',
        background: '#333',
        color: '#fff',
      },
    };
  }

  function validateUrl() {
    if (
      !url.includes("youtube.com") &&
      !url.includes("tiktok.com") &&
      !url.includes("instagram.com")
    ) {
      const errorMessage = "This is not a valid URL \n or a Supported Platform";
      setError(errorMessage);
      toast.error(errorMessage, {
        style: {
          borderRadius: '8px',
          background: '#333',
          color: '#fff',
        },
      });
      return false;
    }
    setError(""); 
    return true;
  }

  return (
    <main className="container">
      <h1>Video Downloader</h1>
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
            value={displayedUrl}
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
          <svg className="ytIMG" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z" /> </svg>
          <img className="ttIMG" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw2AHEa003m1a2SgHiCuL3NHMzcLkkQsUEVA&s" alt="TikTok"/>
          <img className="igIMG" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTK5zQ42vVBoRGGYD7A6pKnIIRAT_G-cFVZbA&s" alt="Instagram" />
        </div>
      </form>
    </main>
  );
}

export default App;