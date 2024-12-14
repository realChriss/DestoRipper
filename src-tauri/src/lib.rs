use dirs_next::download_dir;
use std::path::PathBuf;
use std::process::Stdio;
use tokio::process::Command;
use tokio::io::AsyncReadExt;
use std::{env, fs};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Window};

#[tauri::command]
async fn submit(url: String, format: String, window: tauri::Window) -> bool {
    // Versuche die Hauptlogik auszuführen
    if let Err(err) = submit_impl(url, format, window).await {
        eprintln!("Fehler beim Herunterladen: {}", err);
        false
    } else {
        true
    }
}

async fn submit_impl(
    url: String,
    format: String,
    window: Window, // Fenster für Events
) -> Result<(), Box<dyn std::error::Error>> {
    let unix = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
    let ytdlp_path = get_ytdlp_path();
    let ffmpeg_path = get_ffmpeg_path();

    let download_dir = download_dir().unwrap_or_else(|| "./".into());
    let download_path = download_dir.join(format!("video{}.{}", unix.to_string(), format));
    
    let video_path = download_dir.join(unix.to_string() + "video.tmp");
    let audio_path = download_dir.join(unix.to_string() + "audio.tmp");

    let mut video_stream = Vec::new();
    let mut audio_stream = Vec::new();

    // Fortschritt "Download gestartet"
    window.emit("progress", "downloading")?;

    // Video-Stream extrahieren
    let mut video_child = Command::new("python")
        .arg(&ytdlp_path)
        .arg("--ffmpeg-location")
        .arg(&ffmpeg_path)
        .arg("-f")
        .arg("bestvideo")
        .arg("--no-part")
        .arg("-o")
        .arg("-")
        .arg(&url)
        .stdout(Stdio::piped())
        .spawn()?;

    let mut audio_child = Command::new("python")
        .arg(&ytdlp_path)
        .arg("--ffmpeg-location")
        .arg(&ffmpeg_path)
        .arg("-f")
        .arg("bestaudio")
        .arg("--no-part")
        .arg("-o")
        .arg("-")
        .arg(&url)
        .stdout(Stdio::piped())
        .spawn()?;

    
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

    window.emit("progress", "processing")?;

    video_child.wait().await?;
    audio_child.wait().await?;

    println!("Video-Stream: {} Bytes", video_stream.len());
    println!("Audio-Stream: {} Bytes", audio_stream.len());

    fs::write(&audio_path, &audio_stream)?;
    fs::write(&video_path, &video_stream)?;

    println!("Running FFmpeg..");

    window.emit("progress", "Merging video and audio...")?;
    let mut ffmpeg_child = Command::new(&ffmpeg_path)
        .arg("-i")
        .arg(&video_path)
        .arg("-i")
        .arg(&audio_path)
        .arg("-c:v")
        .arg("libx264")
        .arg("-c:a")
        .arg("aac")
        .arg("-map")
        .arg("0:v")
        .arg("-map")
        .arg("1:a")
        .arg("-threads")
        .arg("0")
        .arg(download_path.to_str().unwrap())
        .arg("-y")
        .spawn()?;

    ffmpeg_child.wait().await?;

    fs::remove_file(&video_path)?;
    fs::remove_file(&audio_path)?;
    
    Ok(())
}

fn get_ffmpeg_path() -> PathBuf {
    return env::current_dir().unwrap().join("bin").join("ffmpeg.exe");
}

fn get_ytdlp_path() -> PathBuf {
    return env::current_dir().unwrap().join("bin").join("yt-dlp.pyz");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![submit])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}