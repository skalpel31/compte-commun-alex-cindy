"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function subscribeSupport() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export function NotificationSettings() {
  const supported = useSyncExternalStore(
    () => () => {},
    subscribeSupport,
    () => false
  );
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setEnabled(!!sub);
    });
  }, [supported]);

  async function handleToggle(checked: boolean) {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      if (checked) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Notifications refusées par le navigateur");
          setLoading(false);
          return;
        }
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          toast.error("Configuration manquante");
          setLoading(false);
          return;
        }
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });
        if (!res.ok) throw new Error("save failed");
        setEnabled(true);
        toast.success("Notifications activées");
      } else {
        const sub = await registration.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        await fetch("/api/push/subscribe", { method: "DELETE" });
        setEnabled(false);
        toast.success("Notifications désactivées");
      }
    } catch {
      toast.error("Échec de l'activation des notifications");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return <p className="text-xs text-muted-foreground">Non pris en charge par ce navigateur.</p>;
  }

  return <Switch checked={enabled} onCheckedChange={handleToggle} disabled={loading} />;
}
