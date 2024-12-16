use crate::util;
use tokio::process::Command;

pub async fn get_video_info(url: String) -> Result<String, String> {
    let output = Command::new("python")
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