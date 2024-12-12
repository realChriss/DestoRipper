import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
    const [url, setUrl] = useState("");

  async function convert() {
    await invoke("submit", { url, format: "mp3" })
  }

  return (
    <main className="container">
      <h1>Video Downloader</h1>
      <p>Download Videos or MP3`s from many Platforms</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          convert();
        }}
      >
        <input
          id="url-input"
          onChange={(e) => setUrl(e.currentTarget.value)}
          placeholder="Paste the Video URL..."
        />
        <button type="submit">Convert</button>
      </form>
      <form>
      <h2 className="PlatformSupportH2">Platforms we Support:</h2>
          <div className="platformsIMG">
            
            
            <svg className="ytIMG" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z"/></svg>
            <img className="ttIMG" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw2AHEa003m1a2SgHiCuL3NHMzcLkkQsUEVA&s" alt="TikTok"/>
            <img className="igIMG" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTK5zQ42vVBoRGGYD7A6pKnIIRAT_G-cFVZbA&s" alt="Instagram"/>
         
         </div>
      </form>
    </main>
  );
}

export default App;
