use crate::util;
use serde_json::Value;
use tokio::process::Command;

pub async fn get_video_info(url: String) -> Result<String, String> {
    let output = Command::new(util::get_python_name())
        .arg(util::get_ytdlp_path())
        .arg("-j") 
        .arg(url) 
        .output() 
        .await;

    match output {
        Ok(output) => {
            if output.status.success() {
                String::from_utf8(output.stdout)
                    .map_err(|e| format!("Fehler beim Dekodieren von stdout: {}", e))
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        }
        Err(e) => Err(format!("Fehler beim Ausführen des Befehls: {}", e)),
    }
}

pub async fn download_stream(url: String, format_id: String, download_id: String, queue_ext: String) -> Result<(), String> {
    let output_file = util::get_temp_path(Some(download_id + &queue_ext));
    println!("Downloading to: {}", output_file.to_string_lossy());

    let output = Command::new(util::get_python_name())
        .arg(util::get_ytdlp_path())        
        .arg("-f") .arg(format_id)
        .arg("-o").arg(output_file)
        .arg("--no-part")
        .arg("--no-playlist")
        .arg(url) 
        .output() 
        .await;

    match output {
        Ok(output) => {
            if output.status.success() {
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

pub fn get_best_video(json_string: String) -> Option<Value> {
    let json_result = serde_json::from_str::<Value>(&json_string);
    if json_result.is_err() {
        return None;
    }
    let json = json_result.unwrap();

    let formats = json.get("formats")?.as_array()?;

    let best_video = formats.iter()
        .filter(|f| f.get("quality").and_then(|q| q.as_f64()).is_some()
            && f.get("format_note").and_then(|f| f.as_str()).unwrap_or("") != "Premium"
            && f.get("vcodec").and_then(|f| f.as_str()).unwrap_or("") != "none") // Filtere nur Einträge mit float "quality"
        .max_by(|a, b| {
            let quality_a = a.get("quality").and_then(|q| q.as_f64()).unwrap_or(0.0);
            let quality_b = b.get("quality").and_then(|q| q.as_f64()).unwrap_or(0.0);
            quality_a.partial_cmp(&quality_b).unwrap_or(std::cmp::Ordering::Equal)
        });

    let best_video_result = best_video.cloned();

    if best_video_result.is_none() {
        return None;
    }
    
    return Some(best_video_result.unwrap());
}

pub fn get_best_audio(json_string: String) -> Option<Value> {
    let json_result = serde_json::from_str::<Value>(&json_string);
    if json_result.is_err() {
        return None;
    }
    let json = json_result.unwrap();

    let formats = json.get("formats")?.as_array()?;

    let best_audio = formats.iter()
        .filter(|f| f.get("quality").and_then(|q| q.as_f64()).is_some()
            && f.get("acodec").and_then(|f| f.as_str()).unwrap_or("") != "none") // Filtere nur Einträge mit float "quality"
        .max_by(|a, b| {
            let quality_a = a.get("quality").and_then(|q| q.as_f64()).unwrap_or(0.0);
            let quality_b = b.get("quality").and_then(|q| q.as_f64()).unwrap_or(0.0);
            quality_a.partial_cmp(&quality_b).unwrap_or(std::cmp::Ordering::Equal)
        });

    let best_audio_result = best_audio.cloned();

    if best_audio_result.is_none() {
        return None;
    }
    
    return Some(best_audio_result.unwrap());
}