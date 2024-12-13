use dirs_next::download_dir;
use std::process::Stdio;
use tokio::process::Command;
use tokio::fs::File;
use std::path::{Path, PathBuf};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

const YTDLP_PATH: &str = "../yt_dlp/yt-dlp.pyz";

#[tauri::command]
async fn submit(url: String, format: String) -> bool {
    // Versuche die Hauptlogik auszuführen
    if let Err(err) = submit_impl(url, format).await {
        eprintln!("Fehler beim Herunterladen: {}", err);
        false
    } else {
        true
    }
}

async fn submit_impl(url: String, format: String) -> Result<(), Box<dyn std::error::Error>> {
    let download_path = download_dir().unwrap_or_else(|| "./".into());
    let download_path = download_path.join(format!("downloaded_video.{}", format));

    let mut child = Command::new("python")
        .arg("src\\yt-dlp.pyz")
        .arg("--ffmpeg-location")
        .arg("src\\ffmpeg.exe")
        .arg("-o")
        .arg("-")
        .arg(&url)
        .stdout(Stdio::piped())
        .spawn()
        .expect("yt-dlp konnte nicht gestartet werden");

    if let Some(mut stdout) = child.stdout.take() {
        // Speicherstream erstellen
        let mut memory_stream = Vec::new();
        let mut buffer = [0u8; 8192];

        // Lesen der stdout in den Speicherstream
        loop {
            let bytes_read = stdout.read(&mut buffer).await?;
            if bytes_read == 0 {
                break; // Keine Daten mehr
            }
            memory_stream.extend_from_slice(&buffer[..bytes_read]);
        }

        println!("Video erfolgreich in den Speicher geladen ({} Bytes)", memory_stream.len());

        // Optional: Speichern in einer Datei
        let mut file = File::create(download_path).await?;
        file.write_all(&memory_stream).await?;
    } else {
        eprintln!("Fehler: Kein Zugriff auf die stdout von yt-dlp.");
    }

    Ok(())
}

fn get_yt_dlp_path() -> PathBuf {
    let current_dir = std::env::current_dir().expect("Fehler beim Abrufen des aktuellen Verzeichnisses");

    let yt_dlp_path = current_dir
        .parent() // Ein Verzeichnis zurück
        .expect("Kein übergeordnetes Verzeichnis vorhanden")
        .join("yt_dlp/yt-dlp.pyz");

    yt_dlp_path
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![submit])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}