from django.db import models
from accounts.models import User
# Create your models here.


class Community(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_communities')
    members = models.ManyToManyField(User, related_name="community_members")

    def __str__(self):
        return self.name
