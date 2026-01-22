// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_shell::ShellExt;
use std::time::Duration;
use std::thread;
use std::net::TcpStream;
use std::fs::OpenOptions;
use std::io::Write;

fn log_debug(location: &str, message: &str, data: &str) {
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(r"c:\Users\werter-dev\dev\projetos\DotnetMonitor\.cursor\debug.log")
    {
        let log_entry = format!(
            r#"{{"location":"{}","message":"{}","data":{},"timestamp":{},"sessionId":"debug-session","runId":"run1"}}"#,
            location,
            message.replace('"', "\\\""),
            data,
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()
        );
        let _ = writeln!(file, "{}", log_entry);
    }
}

fn check_backend_ready(port: &str) -> bool {
    match port.parse::<u16>() {
        Ok(port_num) => {
            let result = TcpStream::connect(format!("127.0.0.1:{}", port_num)).is_ok();
            log_debug("main.rs:check_backend_ready", "Verificando conexão TCP", &format!(r#"{{"port":"{}","connected":{}}}"#, port, result));
            result
        }
        Err(e) => {
            log_debug("main.rs:check_backend_ready", "Erro ao parsear porta", &format!(r#"{{"port":"{}","error":"{}"}}"#, port, e));
            false
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // #region agent log
            log_debug("main.rs:setup", "Iniciando setup do Tauri", r#"{"step":"start"}"#);
            // #endregion
            
            // Iniciar backend como sidecar
            // Usar porta fixa 5000 para garantir que frontend e backend usem a mesma porta
            let backend_port = "5000".to_string();
            
            // #region agent log
            log_debug("main.rs:setup", "Porta do backend determinada", &format!(r#"{{"port":"{}","fromEnv":{}}}"#, backend_port, std::env::var("PORT").is_ok()));
            // #endregion
            
            eprintln!("[Tauri] Iniciando backend na porta: {}", backend_port);
            
            // #region agent log
            log_debug("main.rs:setup", "Criando comando sidecar", r#"{"sidecarName":"PostgresMonitor.Api"}"#);
            // #endregion
            
            let (_rx, child) = match app
                .shell()
                .sidecar("PostgresMonitor.Api")
            {
                Ok(cmd) => {
                    // #region agent log
                    log_debug("main.rs:setup", "Comando sidecar criado com sucesso", r#"{"step":"spawning"}"#);
                    // #endregion
                    
                    match cmd.env("PORT", &backend_port).spawn() {
                        Ok((rx, child)) => {
                            let pid = child.pid();
                            // #region agent log
                            log_debug("main.rs:setup", "Backend spawnado com sucesso", &format!(r#"{{"pid":{:?},"port":"{}"}}"#, pid, backend_port));
                            // #endregion
                            eprintln!("[Tauri] Backend iniciado com sucesso (PID: {:?})", pid);
                            (rx, child)
                        }
                        Err(e) => {
                            // #region agent log
                            log_debug("main.rs:setup", "Erro ao spawnar backend", &format!(r#"{{"error":"{}"}}"#, e));
                            // #endregion
                            eprintln!("[Tauri] ERRO: Falha ao iniciar backend: {}", e);
                            return Err(e.into());
                        }
                    }
                }
                Err(e) => {
                    // #region agent log
                    log_debug("main.rs:setup", "Erro ao criar comando sidecar", &format!(r#"{{"error":"{}"}}"#, e));
                    // #endregion
                    eprintln!("[Tauri] ERRO: Falha ao criar comando sidecar: {}", e);
                    return Err(e.into());
                }
            };
            
            // Manter o handle do processo vivo
            let _child_handle = Box::leak(Box::new(child));
            
            // Aguardar backend iniciar e verificar se está respondendo
            let max_attempts = 15; // 7.5 segundos no total
            let mut attempts = 0;
            let mut backend_ready = false;
            
            // #region agent log
            log_debug("main.rs:setup", "Iniciando loop de verificação", &format!(r#"{{"maxAttempts":{},"port":"{}"}}"#, max_attempts, backend_port));
            // #endregion
            
            eprintln!("[Tauri] Aguardando backend ficar pronto na porta {}...", backend_port);
            
            while attempts < max_attempts {
                thread::sleep(Duration::from_millis(500));
                attempts += 1;
                
                // #region agent log
                log_debug("main.rs:setup", "Tentativa de conexão", &format!(r#"{{"attempt":{},"maxAttempts":{},"port":"{}"}}"#, attempts, max_attempts, backend_port));
                // #endregion
                
                // Tentar conectar ao backend via TCP
                if check_backend_ready(&backend_port) {
                    // #region agent log
                    log_debug("main.rs:setup", "Backend está pronto", &format!(r#"{{"attempt":{},"port":"{}"}}"#, attempts, backend_port));
                    // #endregion
                    eprintln!("[Tauri] Backend está pronto e respondendo na porta {}!", backend_port);
                    backend_ready = true;
                    break;
                }
            }
            
            // #region agent log
            log_debug("main.rs:setup", "Loop de verificação concluído", &format!(r#"{{"backendReady":{},"attempts":{},"port":"{}"}}"#, backend_ready, attempts, backend_port));
            // #endregion
            
            if !backend_ready {
                eprintln!("[Tauri] AVISO: Backend pode não estar pronto após {} tentativas. Continuando mesmo assim...", attempts);
                eprintln!("[Tauri] Verifique se o backend está rodando corretamente na porta {}", backend_port);
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
