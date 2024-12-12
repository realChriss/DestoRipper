use rusty_ytdl::{
    Video,
    VideoSearchOptions,
    VideoOptions,
    VideoQuality
};
use dirs_next::{self, download_dir};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
async fn submit(url: String, format: String, path: String) {
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
    let video_info = video.get_info().await.unwrap();
 
    // Bruder ab hier weiß ich ong nicht weiter wie man an den user download order kommt
    // mit diesem shit ass rust shit nga. so schlecht gemacht digga fuck den shit 
    // es ist 2h nachts 
    let download_path = download_dir();

    video.download(download_path).await.unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![submit])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
