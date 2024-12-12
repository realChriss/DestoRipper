import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [displayedUrl, setDisplayedUrl] = useState("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (url.length > 30 && !isTypingRef.current) {
      const interval = setInterval(() => {
        setDisplayedUrl((prev) => {
          const spacedUrl = " " + prev + " ";
          return spacedUrl.slice(1) + spacedUrl[0];
        });
      }, 100); 
      return () => clearInterval(interval);
    } else {
      setDisplayedUrl(url);
    }
  }, [url, isTypingRef.current]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;
    setUrl(newValue);
    setDisplayedUrl(newValue);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    isTypingRef.current = true;

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 200); 
  };

  async function convert() {
    await invoke("submit", { url, format: "mp3" });
  }

  function validateUrl() {
    if (
      !url.includes("youtube.com") &&
      !url.includes("tiktok.com") &&
      !url.includes("instagram.com")
    ) {
      setError("This platform is not supported");
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
            placeholder={error || "Paste the Video URL..."}
            style={error ? { borderColor: "red", color: "red" } : {}}
          />
        </div>
        <button type="submit">Convert</button>
      </form>

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