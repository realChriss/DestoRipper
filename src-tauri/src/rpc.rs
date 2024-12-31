use std::sync::Arc;
use tokio::sync::Mutex;
use discord_rich_presence::{activity::{self, Activity, Timestamps}, DiscordIpc, DiscordIpcClient};
use std::time::{SystemTime, UNIX_EPOCH};
use std::time::Duration;

pub struct DiscordState {
    pub client: Arc<Mutex<Option<DiscordIpcClient>>>,
}

impl DiscordState {
    pub fn new() -> Self {
        Self {
            client: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn start_rpc(&self, client_id: &str ) -> Result<(), String> {
        let mut client = DiscordIpcClient::new(client_id)
            .map_err(|e| format!("Fehler beim Erstellen des Clients: {}", e))?;

        client.connect()
            .map_err(|e| format!("Fehler beim Starten des Discord IPC-Clients: {}", e))?;

        // Erstelle die Aktivität für Rich Presence
        let time_unix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let mut activity = Activity::new()
            .details("Desto Ripper")  // Details
            .state("Menacinig") // Status
            .timestamps(Timestamps::new().start(time_unix)); // Startzeit

        let assets = activity::Assets::new()
            .large_image("large");  // Text, der angezeigt wird, wenn man mit der Maus über das Bild fährt

        activity = activity.assets(assets);

        client.set_activity(activity)
            .map_err(|e| format!("Fehler beim Setzen der Aktivität: {}", e))?;

        // Speichere den Client im Mutex
        let mut client_lock = self.client.lock().await;
        *client_lock = Some(client);

        println!("Discord Rich Presence gestartet!");

        // Damit der Client weiterhin läuft, kannst du ihn im Hintergrund laufen lassen.
        
        loop {
            tokio::time::sleep(Duration::from_secs(1000)).await;
        }
    }
}
