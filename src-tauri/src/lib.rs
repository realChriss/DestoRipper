use rusty_ytdl::{
    Video,
    VideoSearchOptions,
    VideoOptions,
    VideoQuality
};
use dirs_next::download_dir;
use std::path::PathBuf;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
async fn submit(url: String, format: String) {
    let format_type: VideoSearchOptions;
    
    if format == "mp4" {
        format_type = VideoSearchOptions::Video;
    } else {
        format_type = VideoSearchOptions::Audio;
    }

    let video_options = VideoOptions {
        quality: VideoQuality::Highest,
        filter: format_type,
        ..Default::default()
    };
    
    let video = Video::new_with_options(url, video_options).unwrap();
    
    let download_path = download_dir().expect("Failed to get download directory");
    let mut file_path = PathBuf::from(download_path);
    file_path.push("downloaded_video.mp4"); // Change the file name and extension as needed

    video.download(&file_path).await.unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![submit])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}