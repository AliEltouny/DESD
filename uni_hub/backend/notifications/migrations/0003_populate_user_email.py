from django.db import migrations

def populate_user_emails(apps, schema_editor):
    Notification = apps.get_model('notifications', 'Notification')
    for notification in Notification.objects.filter(user_email__isnull=True):
        if notification.user:
            notification.user_email = notification.user.email
            notification.save()

class Migration(migrations.Migration):
    dependencies = [
        ('notifications', '0002_notification_user_email'),  # This should match your previous migration
    ]

    operations = [
        migrations.RunPython(populate_user_emails),
    ]