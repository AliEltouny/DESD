from django.core.management.base import BaseCommand
from communities.models import Community, Post, Comment, Membership
from django.db.models import Count


class Command(BaseCommand):
    help = 'Updates all cache counter fields in the communities app'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Updating community member counts...'))
        
        # Update community member counts
        communities = Community.objects.all()
        count = 0
        for community in communities:
            member_count = Membership.objects.filter(
                community=community,
                status='approved'
            ).count()
            
            Community.objects.filter(id=community.id).update(
                member_count_cache=member_count
            )
            count += 1
            
            if count % 100 == 0:
                self.stdout.write(f'  Updated {count} communities')
                
        self.stdout.write(self.style.SUCCESS(f'Updated {count} community member counts'))
        
        self.stdout.write(self.style.SUCCESS('Updating post counters...'))
        
        # Update post counters
        posts = Post.objects.all()
        count = 0
        for post in posts:
            comment_count = Comment.objects.filter(post=post).count()
            upvote_count = post.upvotes.count()
            
            Post.objects.filter(id=post.id).update(
                comment_count_cache=comment_count,
                upvote_count_cache=upvote_count
            )
            count += 1
            
            if count % 100 == 0:
                self.stdout.write(f'  Updated {count} posts')
                
        self.stdout.write(self.style.SUCCESS(f'Updated {count} post counters'))
        
        self.stdout.write(self.style.SUCCESS('Updating comment upvote counts...'))
        
        # Update comment upvote counts
        comments = Comment.objects.all()
        count = 0
        for comment in comments:
            upvote_count = comment.upvotes.count()
            
            Comment.objects.filter(id=comment.id).update(
                upvote_count_cache=upvote_count
            )
            count += 1
            
            if count % 100 == 0:
                self.stdout.write(f'  Updated {count} comments')
                
        self.stdout.write(self.style.SUCCESS(f'Updated {count} comment upvote counts'))
        
        self.stdout.write(self.style.SUCCESS('All cache counters updated successfully!')) 