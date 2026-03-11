import os
from datetime import datetime
from typing import Optional
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")

twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
else:
    print("Warning: Twilio credentials not configured — notifications disabled")

VOICE_SCRIPTS = {
    "task_reminder_en": (
        "Hello, this is KrishiAI, your smart farm assistant. "
        "You have an important farm task due today: {task_title}. "
        "Please complete this task to keep your farm on schedule. "
        "Press 1 to acknowledge this reminder, or press 2 to postpone by one day. "
        "Thank you."
    ),
    "task_reminder_hi": (
        "Namaste, main KrishiAI hoon, aapka smart farm assistant. "
        "Aapke farm mein aaj ek zaroori kaam hai: {task_title}. "
        "Kripya is kaam ko poora karein. "
        "Yad karne ke liye 1 dabayein, ya ek din baad ke liye 2 dabayein. "
        "Dhanyavaad."
    ),
    "task_reminder_te": (
        "Namaskaram, meeru KrishiAI, meeru smart farm assistant. "
        "Meeru farm lo ee roju oka mukhyamaina pani undi: {task_title}. "
        "Dayachesi ee pani cheyyandi. "
        "Gurthu chestukunte 1 noccandi, roju postpone chesukovalante 2 noccandi. "
        "Dhanyavaadalu."
    ),
    "alert_en": (
        "Alert from KrishiAI. {alert_message}. "
        "Please take immediate action on your farm. "
        "Press 1 to acknowledge this alert."
    ),
    "daily_log_en": (
        "Good evening, this is your KrishiAI daily farm summary for {date}. "
        "{summary}. "
        "Have a good evening. Goodbye."
    ),
}


def _build_twiml(script: str, task_id: Optional[str] = None) -> str:
    response = VoiceResponse()

    if task_id:
        gather = Gather(
            num_digits=1,
            action=f"{APP_BASE_URL}/voice/acknowledge/{task_id}",
            method="POST",
            timeout=10,
        )
        gather.say(script, voice="alice", language="en-IN")
        response.append(gather)
        response.say("We did not receive your input. Goodbye.", voice="alice")
    else:
        response.say(script, voice="alice", language="en-IN")

    return str(response)


def send_voice_call(
    phone_number: str,
    script_key: str,
    template_vars: Optional[dict] = None,
    task_id: Optional[str] = None,
    language: str = "en",
) -> Optional[str]:
    if not twilio_client:
        print(f"[Voice stub] Would call {phone_number}: {script_key}")
        return None

    lang_key = f"{script_key}_{language}" if f"{script_key}_{language}" in VOICE_SCRIPTS else f"{script_key}_en"
    script_template = VOICE_SCRIPTS.get(lang_key, VOICE_SCRIPTS.get(f"{script_key}_en", ""))

    if template_vars:
        script = script_template.format(**template_vars)
    else:
        script = script_template

    twiml = _build_twiml(script, task_id)

    try:
        call = twilio_client.calls.create(
            twiml=twiml,
            to=phone_number,
            from_=TWILIO_PHONE_NUMBER,
        )
        print(f"Voice call initiated: {call.sid} to {phone_number}")
        return call.sid
    except Exception as e:
        print(f"Error making voice call to {phone_number}: {e}")
        return None


def send_sms(phone_number: str, message: str) -> Optional[str]:
    if not twilio_client:
        print(f"[SMS stub] Would SMS {phone_number}: {message}")
        return None

    try:
        msg = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number,
        )
        return msg.sid
    except Exception as e:
        print(f"Error sending SMS to {phone_number}: {e}")
        return None


def send_whatsapp(phone_number: str, message: str) -> Optional[str]:
    if not twilio_client:
        print(f"[WhatsApp stub] Would message {phone_number}: {message}")
        return None

    wa_to = f"whatsapp:{phone_number}"
    try:
        msg = twilio_client.messages.create(
            body=message,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=wa_to,
        )
        return msg.sid
    except Exception as e:
        print(f"Error sending WhatsApp to {phone_number}: {e}")
        return None


def send_task_reminder(
    phone_number: str,
    task_title: str,
    task_id: str,
    channel: str = "voice",
    language: str = "en",
) -> Optional[str]:
    if channel == "voice":
        return send_voice_call(
            phone_number=phone_number,
            script_key="task_reminder",
            template_vars={"task_title": task_title},
            task_id=task_id,
            language=language,
        )
    elif channel == "sms":
        message = (
            f"KrishiAI Reminder: You have a farm task due today: {task_title}. "
            f"Please complete it on time."
        )
        return send_sms(phone_number, message)
    elif channel == "whatsapp":
        message = (
            f"*KrishiAI Farm Reminder* 🌱\n\n"
            f"You have a task due today:\n*{task_title}*\n\n"
            f"Please complete it to keep your farm on schedule."
        )
        return send_whatsapp(phone_number, message)
    return None


def send_alert_notification(
    phone_number: str,
    alert_message: str,
    channel: str = "sms",
    language: str = "en",
) -> Optional[str]:
    if channel == "voice":
        return send_voice_call(
            phone_number=phone_number,
            script_key="alert",
            template_vars={"alert_message": alert_message},
            language=language,
        )
    elif channel == "sms":
        return send_sms(phone_number, f"KrishiAI Alert: {alert_message}")
    elif channel == "whatsapp":
        return send_whatsapp(phone_number, f"🚨 *KrishiAI Alert*\n\n{alert_message}")
    return None


def send_daily_log_notification(
    phone_number: str,
    date: str,
    summary: str,
    channel: str = "whatsapp",
) -> Optional[str]:
    if channel == "whatsapp":
        message = (
            f"🌾 *KrishiAI Daily Farm Log — {date}*\n\n"
            f"{summary}\n\n"
            f"Open the KrishiAI app to view the full report."
        )
        return send_whatsapp(phone_number, message)
    elif channel == "sms":
        short_summary = summary[:140] if len(summary) > 140 else summary
        return send_sms(phone_number, f"KrishiAI Daily Log {date}: {short_summary}")
    elif channel == "voice":
        return send_voice_call(
            phone_number=phone_number,
            script_key="daily_log",
            template_vars={"date": date, "summary": summary[:200]},
        )
    return None


def log_voice_call(supabase, task_id: str, call_sid: str, phone_number: str, status: str = "initiated"):
    try:
        supabase.table("voice_call_logs").insert({
            "task_id": task_id,
            "call_sid": call_sid,
            "phone_number": phone_number,
            "status": status,
            "initiated_at": datetime.utcnow().isoformat(),
        }).execute()
    except Exception as e:
        print(f"Error logging voice call: {e}")


def update_call_acknowledgment(supabase, task_id: str, call_sid: str, digit_pressed: str):
    try:
        acknowledged = digit_pressed == "1"
        postponed = digit_pressed == "2"

        supabase.table("voice_call_logs").update({
            "status": "acknowledged" if acknowledged else ("postponed" if postponed else "no_response"),
            "acknowledged_at": datetime.utcnow().isoformat() if acknowledged else None,
            "digit_pressed": digit_pressed,
        }).eq("call_sid", call_sid).execute()

        if postponed:
            from datetime import timedelta
            task = supabase.table("tasks").select("due_date").eq("id", task_id).single().execute()
            if task.data:
                current_due = datetime.fromisoformat(task.data["due_date"].replace("Z", "+00:00"))
                new_due = current_due + timedelta(days=1)
                supabase.table("tasks").update({
                    "due_date": new_due.isoformat(),
                }).eq("id", task_id).execute()

    except Exception as e:
        print(f"Error updating call acknowledgment: {e}")
