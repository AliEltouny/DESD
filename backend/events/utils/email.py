from django.core.mail import send_mail
from django.conf import settings

def send_event_join_confirmation(user, event):
    subject = f"You're Confirmed for {event.title} 🎉"
    message = f"""Hi {user.first_name},

You're confirmed for the event:

📌 {event.title}  
📍 Location: {event.location}  
📅 Date & Time: {event.date_time.strftime('%A, %d %B %Y at %I:%M %p')}

See you there!
UniHub Team
"""
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
