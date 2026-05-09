"""Notification helpers — Resend (email) + Twilio (WhatsApp).

Both helpers are optional and feature-flagged:
- If ENV vars are missing, the helpers log a warning and return False (never raise).
- This guarantees order placement / status updates never fail because of a downed
  notification provider.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Email — Resend
# ---------------------------------------------------------------------------
def email_enabled() -> bool:
    return (
        os.environ.get("ENABLE_EMAIL_NOTIFICATIONS", "true").lower() == "true"
        and bool(os.environ.get("RESEND_API_KEY"))
        and bool(os.environ.get("RESEND_FROM_EMAIL"))
    )


def send_email(to: str, subject: str, html: str, text: Optional[str] = None) -> bool:
    if not email_enabled():
        logger.debug("Email skipped (disabled or missing config) → %s · %s", to, subject)
        return False
    try:
        import resend  # type: ignore
        resend.api_key = os.environ["RESEND_API_KEY"]
        params = {
            "from": os.environ["RESEND_FROM_EMAIL"],
            "to": [to],
            "subject": subject,
            "html": html,
        }
        if text:
            params["text"] = text
        resp = resend.Emails.send(params)
        rid = getattr(resp, "id", None) or (resp.get("id") if isinstance(resp, dict) else None)
        if rid:
            logger.info("Email sent → %s (id=%s)", to, rid)
            return True
        logger.error("Email send returned no id → %s", to)
        return False
    except Exception as e:
        logger.error("Email send failed → %s: %s", to, e)
        return False


# ---------------------------------------------------------------------------
# WhatsApp — Twilio
# ---------------------------------------------------------------------------
def whatsapp_enabled() -> bool:
    return (
        os.environ.get("ENABLE_WHATSAPP_NOTIFICATIONS", "true").lower() == "true"
        and bool(os.environ.get("TWILIO_ACCOUNT_SID"))
        and bool(os.environ.get("TWILIO_AUTH_TOKEN"))
        and bool(os.environ.get("TWILIO_WHATSAPP_FROM"))
    )


def normalize_indian_phone(phone: str) -> Optional[str]:
    """Best-effort normalisation to E.164 for Indian numbers."""
    if not phone:
        return None
    digits = "".join(c for c in phone if c.isdigit() or c == "+")
    if digits.startswith("+"):
        return digits
    if len(digits) == 10:
        return "+91" + digits
    if len(digits) == 12 and digits.startswith("91"):
        return "+" + digits
    if len(digits) == 11 and digits.startswith("0"):
        return "+91" + digits[1:]
    return None


def send_whatsapp(to: str, body: str) -> bool:
    if not whatsapp_enabled():
        logger.debug("WhatsApp skipped (disabled or missing config) → %s", to)
        return False
    e164 = normalize_indian_phone(to)
    if not e164:
        logger.warning("WhatsApp skipped (invalid phone) → %s", to)
        return False
    try:
        from twilio.rest import Client  # type: ignore
        client = Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])
        msg = client.messages.create(
            from_=os.environ["TWILIO_WHATSAPP_FROM"],
            to=f"whatsapp:{e164}",
            body=body,
        )
        if msg.sid:
            logger.info("WhatsApp sent → %s (sid=%s)", e164, msg.sid)
            return True
        return False
    except Exception as e:
        logger.error("WhatsApp send failed → %s: %s", e164, e)
        return False


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
def order_confirmation_email(order: dict) -> tuple[str, str]:
    items_html = "".join(
        f"<li><strong>{it['name']}</strong> · {it['size']} · ×{it['qty']} — ₹{int(it['price'])}</li>"
        for it in order.get("items", [])
    )
    addr = order.get("address", {})
    html = f"""
    <div style="font-family:Inter,Arial,sans-serif;background:#f6f0e8;padding:32px;color:#271820;">
      <div style="max-width:600px;margin:0 auto;background:#fdfaf5;border:1px solid rgba(39,24,32,.1);padding:36px;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:500;letter-spacing:0.04em;">
          Siri<span style="color:#b88a4a;">.</span>
        </div>
        <div style="font-family:monospace;font-size:11px;letter-spacing:0.18em;color:#8a7a82;text-transform:uppercase;margin-top:6px;">
          Order confirmation · {order["id"]}
        </div>
        <h1 style="font-family:'Cormorant Garamond',serif;font-weight:400;font-size:36px;margin:18px 0 6px;">
          Thank you, <em style="color:#6e2a3c;">{order.get("customer", "friend")}</em>.
        </h1>
        <p style="color:#5a4a52;line-height:1.7;">
          We've received your order at the Siri Boutique atelier.
          Our team will confirm dispatch within 24 hours and update you on every step.
        </p>
        <h3 style="font-family:'Cormorant Garamond',serif;font-weight:500;margin-top:28px;border-top:1px solid rgba(39,24,32,.1);padding-top:20px;">Items</h3>
        <ul style="padding-left:18px;color:#271820;">{items_html}</ul>
        <p style="margin:18px 0 4px;color:#5a4a52;">Shipping to <strong>{addr.get("full_name", "")}</strong></p>
        <p style="margin:0;color:#5a4a52;font-size:13px;">{addr.get("line1","")}{', ' + addr.get("line2","") if addr.get("line2") else ""}, {addr.get("city","")}, {addr.get("state","")} {addr.get("pincode","")}</p>
        <p style="margin-top:20px;border-top:1px solid #271820;padding-top:14px;font-size:18px;font-weight:500;">Total · ₹{int(order.get("total", 0)):,}</p>
        <p style="font-size:12px;color:#8a7a82;font-family:monospace;letter-spacing:0.06em;">{("PAY ON DELIVERY" if order.get("payment_method") == "cod" else "PAID ONLINE")}</p>
        <p style="font-size:12px;color:#8a7a82;margin-top:28px;">Siri Boutique · Where Style Meets Perfection · +91 98855 07423 · Kondapur, Hyderabad</p>
      </div>
    </div>
    """
    text = f"Order {order['id']} placed. Total: ₹{int(order.get('total',0)):,}. — Siri Boutique"
    return html, text


def order_status_email(order: dict, new_status: str) -> tuple[str, str]:
    pretty = {
        "new": "Confirmed", "cutting": "Cutting & pattern", "stitching": "Stitching in atelier",
        "shipped": "Shipped", "delivered": "Delivered", "return": "Return requested", "refunded": "Refunded",
    }.get(new_status, new_status.title())
    html = f"""
    <div style="font-family:Inter,Arial,sans-serif;background:#f6f0e8;padding:32px;color:#271820;">
      <div style="max-width:560px;margin:0 auto;background:#fdfaf5;border:1px solid rgba(39,24,32,.1);padding:36px;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;">Siri<span style="color:#b88a4a;">.</span></div>
        <div style="font-family:monospace;font-size:11px;letter-spacing:0.18em;color:#8a7a82;text-transform:uppercase;margin-top:6px;">Order update · {order["id"]}</div>
        <h2 style="font-family:'Cormorant Garamond',serif;font-weight:400;font-size:30px;margin:18px 0 4px;">Your order is now <em style="color:#6e2a3c;">{pretty}</em>.</h2>
        <p style="color:#5a4a52;line-height:1.7;">We will keep you posted as soon as the next step begins.</p>
      </div>
    </div>
    """
    return html, f"Order {order['id']} status: {pretty}"


def order_confirmation_whatsapp(order: dict) -> str:
    return (
        f"Siri Boutique 🌿\nOrder {order['id']} confirmed!\n"
        f"Total: ₹{int(order.get('total', 0)):,} ({'COD' if order.get('payment_method') == 'cod' else 'Online'}).\n"
        f"We'll update you at every step. Track at https://siriboutique.in/order/{order['id']}"
    )


def order_status_whatsapp(order: dict, new_status: str) -> str:
    pretty = {
        "new": "confirmed", "cutting": "in cutting", "stitching": "in stitching",
        "shipped": "shipped 🚚", "delivered": "delivered ✓", "return": "marked for return", "refunded": "refunded",
    }.get(new_status, new_status)
    return f"Siri Boutique\nYour order {order['id']} is now {pretty}."
