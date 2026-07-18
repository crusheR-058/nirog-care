// Nirog patient app — Expo push token registration.
// Store the token on the patient's Account so the backend can notify them the
// instant a doctor picks up ("Dr. X is ready — tap to join"), even if the app
// is backgrounded. deps: npx expo install expo-notifications expo-device
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { supabase } from "./supabase";

export async function registerPushToken() {
  if (!Device.isDevice) return; // push needs a physical device
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // RLS account_update_self lets the signed-in patient write their own row.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("Account")
    .update({ expoPushToken: token })
    .eq("authUserId", user.id);
}

// Server side (Supabase Edge Function, pseudo): on QueueEntry UPDATE where
// state → 'in_consult', look up Account.expoPushToken for the patient and POST
// to https://exp.host/--/api/v2/push/send with:
//   { to: token, title: "Your doctor is ready",
//     body: "Tap to join your consultation", data: { queueId } }
// Deep-link the notification to app/call/<queueId>.
