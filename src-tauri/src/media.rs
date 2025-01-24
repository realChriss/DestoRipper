use std::path::PathBuf;

use crate::util;
use tokio::process::Command;

pub async fn remux(video: PathBuf, download_id: String) -> Result<(), String> {
    let output_file = util::get_download_path(Some(download_id + ".mp4"));
    println!("Remuxing to: {}", output_file.to_string_lossy());

    let ffmpeg_child = Command::new(util::get_ffmpeg_path())
        .arg("-i").arg(video)
        .arg("-c:v").arg("libx264")
        .arg("-c:a").arg("aac")
        .arg("-threads").arg("0")
        .arg("-y") 
        .arg(output_file) 
        .output()
        .await;

    match ffmpeg_child {
        Ok(output) => {
            if output.status.success() {
                println!("Passing remux"); 
                return Ok(());
            } else {
                return Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        }
        Err(e) => {
            return Err(format!("Fehler beim Ausführen des Befehls: {}", e));
        },
    }
}

pub async fn merge(video: PathBuf, audio: PathBuf, download_id: String, copy_vcodec: bool) -> Result<(), String> {
    let output_file = util::get_download_path(Some(download_id + ".mp4"));
    let vcodec = if copy_vcodec { "copy" } else { "libx264" };
    
    println!("Merging with {} to: {}", vcodec, output_file.to_string_lossy());

    let ffmpeg_child = Command::new(util::get_ffmpeg_path())
        .arg("-i").arg(video)
        .arg("-i").arg(audio)
        .arg("-c:v").arg(vcodec)
        .arg("-c:a").arg("aac")
        .arg("-map").arg("0:v")
        .arg("-map").arg("1:a")
        .arg("-threads").arg("0")
        .arg("-y") 
        .arg(output_file) 
        .output()
        .await;

    match ffmpeg_child {
        Ok(output) => {
            if output.status.success() {
                println!("Merging passed"); 
                return Ok(());
            } else {
                return Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        }
        Err(e) => {
            return Err(format!("Fehler beim Ausführen des Befehls: {}", e));
        },
    }
}

pub async fn validate_data(file: PathBuf) -> Result<(), String> {
    let ffmpeg_child = Command::new(util::get_ffmpeg_path())
        .arg("-v")
        .arg("error") // Nur Fehler ausgeben
        .arg("-i")
        .arg(file) // Input von stdin
        .arg("-f")
        .arg("null") // Keine Ausgabe
        .arg("-")
        .output()
        .await;

    match ffmpeg_child {
        Ok(output) => {
            if output.status.success() {
                println!("Validation passed");
                return Ok(());
            } else {
                return Err(String::from_utf8_lossy(&output.stderr).to_string().lines().next().unwrap().to_string())
            }
        }
        Err(e) => {
            return Err(format!("Fehler beim Ausführen des Befehls: {}", e));
        },
    }
}