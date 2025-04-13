from django.db import models

# Create your models here.

class Testimonial(models.Model):
    """Model for storing user testimonials displayed on the landing page"""
    name = models.CharField(max_length=100, help_text="Student's full name")
    role = models.CharField(max_length=100, help_text="Student's role or position (e.g. 'Computer Science Student')")
    university = models.CharField(max_length=100, help_text="University name")
    content = models.TextField(help_text="Testimonial content text")
    image = models.ImageField(upload_to='testimonials/', help_text="Student's photo")
    active = models.BooleanField(default=True, help_text="Whether this testimonial is active and should be displayed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.university}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Testimonial"
        verbose_name_plural = "Testimonials"
