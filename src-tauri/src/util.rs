use std::{env, path::PathBuf};
use dirs_next::download_dir;
use native_dialog::{MessageDialog, MessageType};
use base64::{engine::general_purpose::STANDARD, Engine};

pub fn get_ffmpeg_path() -> PathBuf {
    return env::current_dir().unwrap().join("bin")
        .join(if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" });
}

pub fn get_ytdlp_path() -> PathBuf {
    return env::current_dir().unwrap().join("bin").join("yt-dlp.pyz");
}

pub fn get_temp_path(file_name: Option<String>) -> PathBuf {
    let temp_dir = env::current_dir().unwrap().join("temp");
    if let Some(file_name) = file_name {
        temp_dir.join(file_name)
    } else {
        temp_dir
    }
}

pub fn get_download_path(file_name: Option<String>) -> PathBuf {
    let temp_dir = download_dir().unwrap();
    if let Some(file_name) = file_name {
        temp_dir.join(file_name)
    } else {
        temp_dir
    }
}

pub fn ffmpeg_time_to_sec(time_str: &str) -> Result<f64, String> {
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() != 3 {
        return Err(format!("Ungültiges Zeitformat: {}", time_str));
    }

    let hours: f64 = parts[0].parse().map_err(|e| format!("Fehler bei Stunden-Parsing: {}", e))?;
    let minutes: f64 = parts[1].parse().map_err(|e| format!("Fehler bei Minuten-Parsing: {}", e))?;
    let seconds: f64 = parts[2].parse().map_err(|e| format!("Fehler bei Sekunden-Parsing: {}", e))?;

    Ok(hours * 3600.0 + minutes * 60.0 + seconds)
}

pub fn show_messagebox(message: &str) {
    MessageDialog::new()
        .set_type(MessageType::Info)
        .set_title("Desto Ripper")
        .set_text(message)
        .show_confirm()
        .unwrap();
}

pub fn vector_to_base64(data: Vec<u8>) -> String {
    STANDARD.encode(data)
}

pub fn unlink_temp_files(filenames: Vec<&str>) -> Result<(), String> {
    for filename in filenames {
        let path = get_temp_path(Some(filename.to_string()));
        if path.exists() {
            std::fs::remove_file(path).map_err(|e| format!("Fehler beim Löschen der Datei {}: {}", filename, e))?;
        }
    }
    
    Ok(())
}

pub fn get_python_name() -> String {
    if cfg!(windows) {
        "python".to_string()
    } else {
        "python3".to_string()
    }
}