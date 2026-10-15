"use client";
import { useEffect, useRef, useState } from "react";
import { Wallet, ArrowUpRight, CheckCircle2, RefreshCw } from "lucide-react";
export type CreditCheckoutApi = (
  path: string,
  init?: RequestInit,
) => Promise<any>;
export function useCreditCheckout({
  api,
  signedIn,
  onSignIn,
  onPaid,
}: {
  api: CreditCheckoutApi;
  signedIn: boolean;
  onSignIn: () => void;
  onPaid: () => void;
}) {
  const [available, setAvailable] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [order, setOrder] = useState(""),
    [paid, setPaid] = useState(false);
  const ids = useRef<Record<string, string>>({});
  useEffect(() => {
    fetch("/api/payments/config")
      .then((r) => r.json())
      .then((d) => setAvailable(!!d.available))
      .catch(() => setAvailable(false));
    const id =
      new URLSearchParams(window.location.search).get("order") ||
      sessionStorage.getItem("vista_pending_order");
    if (id && /^[a-f0-9-]{36}$/.test(id)) setOrder(id);
  }, []);
  async function check() {
    if (!order || !signedIn) return;
    try {
      const r = await api(
        "/api/payments/status?id=" + encodeURIComponent(order),
      );
      if (r.status === "paid") {
        setPaid(true);
        setMessage(`${r.credits} кредит амжилттай нэмэгдлээ.`);
        sessionStorage.removeItem("vista_pending_order");
        setOrder("");
        onPaid();
      } else
        setMessage("Төлбөр хүлээгдэж байна. Төлсний дараа дахин шалгана уу.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  useEffect(() => {
    if (!order || !signedIn || paid) return;
    void check();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, 8000);
    const stop = setTimeout(() => clearInterval(timer), 15 * 60 * 1000);
    return () => {
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, [order, signedIn, paid]); // bounded by the active pricing screen; no duplicate credit grants
  async function buy(pack: string) {
    if (!signedIn) {
      onSignIn();
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const id = ids.current[pack] || crypto.randomUUID();
      ids.current[pack] = id;
      const r = await api("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pack }),
      });
      if (r.status === "paid") {
        onPaid();
        setMessage("Энэ захиалга баталгаажсан.");
        delete ids.current[pack];
        return;
      }
      const u = new URL(r.url);
      if (u.protocol !== "https:" || u.hostname !== "pay.wire.mn")
        throw Error("Төлбөрийн холбоос баталгаагүй.");
      sessionStorage.setItem("vista_pending_order", r.id);
      window.location.assign(u.href);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const status = (
    <div className="checkout-status">
      {message && (
        <p role="status">
          {paid ? <CheckCircle2 size={16} /> : <Wallet size={16} />} {message}
        </p>
      )}
      {order && (
        <button
          className="secondary small"
          onClick={() => void check()}
          disabled={!signedIn}
        >
          <RefreshCw size={14} />
          Төлбөр шалгах
        </button>
      )}
    </div>
  );
  return { available, busy, buy, status };
}
