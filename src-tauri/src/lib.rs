use dirs_next::download_dir;
use std::{env::args, process::Stdio};
use tokio::process::Command;
use tokio::fs::File;
use std::path::{Path, PathBuf};
use tokio::io::{AsyncReadExt, AsyncWriteExt, BufWriter};
use std::fs;

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

    let video_path = "video.tmp";
    let audio_path = "audio.tmp";

    // Separate Streams für Video und Audio
    let mut video_stream = Vec::new();
    let mut audio_stream = Vec::new();


    // Video-Stream extrahieren
    let mut video_child = Command::new("python")
        .arg("src\\yt-dlp.pyz")
        .arg("--ffmpeg-location")
        .arg("src\\ffmpeg.exe")
        .arg("-f")
        .arg("bestvideo[vcodec^=avc1]")
        .arg("--no-part")
        .arg("-o")
        .arg("-")
        .arg(&url)
        .stdout(Stdio::piped())
        .spawn()?;

    // Audio-Stream extrahieren
    let mut audio_child = Command::new("python")
        .arg("src\\yt-dlp.pyz")
        .arg("--ffmpeg-location")
        .arg("src\\ffmpeg.exe")
        .arg("-f")
        .arg("bestaudio")
        .arg("--no-part")
        .arg("-o")
        .arg("-")
        .arg(&url)
        .stdout(Stdio::piped())
        .spawn()?;

    // Video-Stream in Speicher laden
    if let Some(mut video_stdout) = video_child.stdout.take() {
        let mut buffer = [0u8; 8192];
        loop {
            let bytes_read = video_stdout.read(&mut buffer).await?;
            if bytes_read == 0 {
                break;
            }
            video_stream.extend_from_slice(&buffer[..bytes_read]);
        }
    }

    // Audio-Stream in Speicher laden
    if let Some(mut audio_stdout) = audio_child.stdout.take() {
        let mut buffer = [0u8; 8192];
        loop {
            let bytes_read = audio_stdout.read(&mut buffer).await?;
            if bytes_read == 0 {
                break;
            }
            audio_stream.extend_from_slice(&buffer[..bytes_read]);
        }
    }

    // Warten auf Beendigung der Child-Prozesse
    video_child.wait().await?;
    audio_child.wait().await?;

    println!("Video-Stream: {} Bytes", video_stream.len());
    println!("Audio-Stream: {} Bytes", audio_stream.len());

    fs::write(&video_path, &video_stream)?;
    fs::write(&audio_path, &audio_stream)?;

    println!("Running FFmpeg..");
    // FFmpeg-Prozess zum Zusammenführen
    let mut ffmpeg_child = Command::new("src\\ffmpeg.exe")
        .arg("-i")
        .arg(video_path)  // Video-Input
        .arg("-i")
        .arg(audio_path)  // Audio-Input
        .arg("-c:v")
        .arg("libx264")
        .arg("-c:a")
        .arg("aac")
        .arg("-map")
        .arg("0:v")
        .arg("-map")
        .arg("1:a")
        .arg(download_path.to_str().unwrap())
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()?;
    
    // FFmpeg-Prozess beenden
    ffmpeg_child.wait().await?;

    fs::remove_file(video_path)?;
    fs::remove_file(audio_path)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![submit])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}