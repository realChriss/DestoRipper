import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  async function convert() {
    setMessage(`Konvertiere: ${url}`);
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
      <p>{message}</p>
    </main>
  );
}

export default App;
