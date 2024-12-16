use std::{env, path::PathBuf};

pub fn get_ffmpeg_path() -> PathBuf {
    return env::current_dir().unwrap().join("bin")
        .join(if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" });
}

pub fn get_ytdlp_path() -> PathBuf {
    return env::current_dir().unwrap().join("bin").join("yt-dlp.pyz");
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