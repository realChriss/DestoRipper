use dirs_next::download_dir;
use std::process::Stdio;
use tokio::process::Command;
use tokio::io::AsyncReadExt;
use std::{env, fs};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Window};
use serde_json::{json, Value};

pub mod dlp;
pub mod util;
pub mod ffmpeg;

#[tauri::command]
async fn submit(url: String, format: String, toast_id: String, window: tauri::Window) -> Result<bool, String> {
    if let Err(err) = submit_impl(url, format, toast_id, window).await {
        eprintln!("Fehler beim Herunterladen: {}", err);
        return Err(err.to_string());
    } else {
        return Ok(true);
    }
}

#[tauri::command]
async fn get_video_info(url: String) -> Value {
    match dlp::get_video_info(url).await {
        Ok(result) => {
            println!("Ausgabe:\n{}", result);
            return json!({
                "success": true, 
                "content": result
            });
        },
        Err(err) => {
            eprintln!("Fehler:\n{}", err);
            return json!({
                "success": false, 
                "content": err
            });
        }
    }
}

#[tauri::command]
async fn get_best_video(json_string: String) -> Value {
    match dlp::get_best_video(json_string) {
        Some(result) => {
            println!("Ausgabe:\n{}", result);
            return json!({
                "success": true, 
                "content": result.to_string()
            });
        },
        None => {
            eprintln!("Kein Video stream gefunden");
            return json!({
                "success": false, 
                "content": "No video stream found"
            });
        }
    }
}

#[tauri::command]
async fn get_best_audio(json_string: String) -> Value {
    match dlp::get_best_audio(json_string) {
        Some(result) => {
            println!("Ausgabe:\n{}", result);
            return json!({
                "success": true, 
                "content": result.to_string()
            });
        },
        None => {
            eprintln!("Kein Audio stream gefunden");
            return json!({
                "success": false, 
                "content": "No audio stream found"
            });
        }
    }
}

#[tauri::command]
async fn download_stream(url: String, format_id: String) -> Value {
    match dlp::download_stream(url, format_id).await {
        Ok(result) => {
            println!("Bytes:\n{}", result.len());
            return json!({
                "success": true, 
                "content": result
            });
        },
        Err(err) => {
            eprintln!("Fehler:{}", err);
            return json!({
                "success": false, 
                "content": err
            });
        }
    }
}

async fn submit_impl(
    url: String,
    format: String,
    toast_id: String,
    window: Window, // Fenster für Events
) -> Result<(), Box<dyn std::error::Error>> {
    let unix = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
    let ytdlp_path = util::get_ytdlp_path();
    let ffmpeg_path = util::get_ffmpeg_path();

    let download_dir = download_dir().unwrap_or_else(|| "./".into());
    let download_path = download_dir.join(format!("video{}.{}", unix.to_string(), format));
    
    let video_path = download_dir.join(unix.to_string() + "video.tmp");
    let audio_path = download_dir.join(unix.to_string() + "audio.tmp");

    let mut video_stream = Vec::new();
    let mut audio_stream = Vec::new();

    // Fortschritt "Download gestartet"
    window.emit("progress", format!("{} {}", toast_id, "downloading"))?;

    // Video-Stream extrahieren
    let mut video_child = Command::new("python")
        .arg(&ytdlp_path)
        .arg("--ffmpeg-location")
        .arg(&ffmpeg_path)
        .arg("-f")
        .arg("bv*")
        .arg("--no-part")
        .arg("--no-playlist")
        .arg("-o")
        .arg("-")
        .arg(&url)
        .stdout(Stdio::piped())
        //.creation_flags(0x08000000)
        .spawn()?;

    let mut audio_child = Command::new("python")
        .arg(&ytdlp_path)
        .arg("--ffmpeg-location")
        .arg(&ffmpeg_path)
        .arg("-f")
        .arg("ba*")
        .arg("--no-part")
        .arg("--no-playlist")
        .arg("-o")
        .arg("-")
        .arg(&url)
        .stdout(Stdio::piped())
        //.creation_flags(0x08000000)
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
    
    video_child.wait().await?;
    audio_child.wait().await?;
    
    println!("Video-Stream: {} Bytes", video_stream.len());
    println!("Audio-Stream: {} Bytes", audio_stream.len());
    
    fs::write(&audio_path, &audio_stream)?;
    fs::write(&video_path, &video_stream)?;

    println!("Running FFmpeg..");
    window.emit("progress", format!("{} {}", toast_id, "processing"))?;
    
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
        //.creation_flags(0x08000000)
        .spawn()?;

    ffmpeg_child.wait().await?;

    //fs::remove_file(&video_path)?;
    //fs::remove_file(&audio_path)?;

    println!("Done");
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            submit, 
            get_video_info, 
            get_best_video, 
            get_best_audio,
            download_stream
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}