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
      <h1>YouTube Converter</h1>

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
          placeholder="Gib die YouTube-URL ein..."
        />
        <button type="submit">Konvertieren</button>
      </form>
    </main>
  );
}

export default App;
