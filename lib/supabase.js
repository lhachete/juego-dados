// lib/supabase.js
// Cliente de Supabase (el "servidor" del modo online).
//
// La URL y la clave pública se leen del archivo .env de la raíz del proyecto
// (mira .env.example). Expo solo deja leer variables que empiezan por
// EXPO_PUBLIC_. La clave pública ("publishable" / "anon") puede ir en la app:
// la seguridad la ponen las reglas de la base de datos. La clave SECRETA
// ("secret" / "service_role") no debe ir NUNCA aquí.
import "react-native-url-polyfill/auto";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

// Si falta el .env, el modo local sigue funcionando y la pantalla online
// muestra un aviso en lugar de romper la app.
export const isOnlineConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isOnlineConfigured
    ? createClient(supabaseUrl, supabaseKey, {
          auth: {
              storage: AsyncStorage,      // la sesión se guarda en el móvil
              autoRefreshToken: true,
              persistSession: true,
              detectSessionInUrl: false,
          },
      })
    : null;

// Renueva la sesión solo mientras la app está abierta (recomendado por
// Supabase para React Native).
if (supabase) {
    AppState.addEventListener("change", (state) => {
        if (state === "active") supabase.auth.startAutoRefresh();
        else supabase.auth.stopAutoRefresh();
    });
}
