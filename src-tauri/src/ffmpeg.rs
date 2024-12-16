use crate::util;
use tauri::window;
use tokio::process::Command;
use tokio::io::{ AsyncBufReadExt, BufReader};
use tauri::{Emitter, Window};

pub async fn merge(file1: String, file2: String, window: tauri::Window) -> Result<(), String> {
    let mut ffmpeg_child = Command::new(util::get_ffmpeg_path())
        .arg("-i")
        .arg(&file1)
        .arg("-i")
        .arg(&file2)
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
        .arg("")
        .arg("-y")
        .stderr(std::process::Stdio::piped())  // Fehlerausgabe in `stderr` leiten
        .stdout(std::process::Stdio::null())
        //.creation_flags(0x08000000)
        .spawn()
        .map_err(|e| format!("Fehler beim Starten von ffmpeg: {}", e))?;

    // Hole den Fehlerstream des Prozesses (stderr)
    if let Some(stderr) = ffmpeg_child.stderr.take() {
        let mut reader = BufReader::new(stderr);

        // Lese die Zeilen aus stderr
        let mut line = String::new();
        while reader.read_line(&mut line).await.map_err(|e| format!("Fehler beim Lesen der Ausgabe: {}", e))? > 0 {
            // Verarbeite die Zeilen und suche nach dem Fortschritt
            if let Some(pos) = line.find("time=") {
                // Extrahiere die Zeit (z.B. time=00:01:30.45)
                let time_str = &line[pos + 5..pos + 14];  // Extrahiere den Zeitstempel

                // Hier konvertierst du die Zeit in eine Prozentzahl
                if let Ok(duration) = util::ffmpeg_time_to_sec(time_str) {
                    // Beispielhafte Berechnung des Fortschritts
                    let total_duration = 3600.0; // Beispiel: 1 Stunde Video
                    let progress = (duration / total_duration) * 100.0;

                    println!("Fortschritt: {:.2}%", progress);
                }
            }

            // Leere die Zeile für den nächsten Lesevorgang
            line.clear();
        }
    }

    // Warte, bis der Prozess abgeschlossen ist
    let status = ffmpeg_child.wait().await.map_err(|e| format!("Fehler beim Warten auf den Prozess: {}", e))?;
    if !status.success() {
        return Err(format!("ffmpeg-Prozess fehlgeschlagen mit Status: {:?}", status));
    }

    Ok(())

}