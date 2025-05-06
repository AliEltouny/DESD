from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from .models import Community, Membership, Post, Comment


User = get_user_model()


class CommunityTests(APITestCase):
    """Test community-related functionality"""
    
    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='test1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )
        self.admin_user = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='adminpass123'
        )
        
        # Create test community
        self.community = Community.objects.create(
            name='Test Community',
            slug='test-community',
            description='A test community',
            creator=self.admin_user,
            is_private=False,
            requires_approval=False
        )
        
        # Create admin membership for admin_user
        Membership.objects.create(
            user=self.admin_user,
            community=self.community,
            role='admin',
            status='approved'
        )
        
        # Create client and authenticate as admin
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def test_list_communities(self):
        """Test listing communities"""
        url = reverse('community-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Test Community')
    
    def test_create_community(self):
        """Test creating a new community"""
        url = reverse('community-list')
        data = {
            'name': 'New Test Community',
            'description': 'A new test community',
            'category': 'academic',
            'is_private': False,
            'requires_approval': False
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Community.objects.count(), 2)
        self.assertEqual(Community.objects.get(slug='new-test-community').name, 'New Test Community')
    
    def test_join_community(self):
        """Test joining a community"""
        # Switch to user1
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('community-join', kwargs={'slug': 'test-community'})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Membership.objects.filter(
            user=self.user1,
            community=self.community,
            status='approved'
        ).exists())
    
    def test_leave_community(self):
        """Test leaving a community"""
        # Create a membership for user1
        Membership.objects.create(
            user=self.user1,
            community=self.community,
            role='member',
            status='approved'
        )
        
        # Switch to user1
        self.client.force_authenticate(user=self.user1)
        
        url = reverse('community-leave', kwargs={'slug': 'test-community'})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Membership.objects.filter(
            user=self.user1,
            community=self.community
        ).exists())
    
    def test_update_member_role(self):
        """Test updating a member's role"""
        # Create a membership for user1
        Membership.objects.create(
            user=self.user1,
            community=self.community,
            role='member',
            status='approved'
        )
        
        # Switch to admin_user
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('community-update-member-role', kwargs={'slug': 'test-community'})
        data = {
            'user_id': self.user1.id,
            'role': 'moderator'
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Membership.objects.get(user=self.user1, community=self.community).role,
            'moderator'
        )


class PostTests(APITestCase):
    """Test post-related functionality"""
    
    def setUp(self):
        # Create test users
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test community
        self.community = Community.objects.create(
            name='Test Community',
            slug='test-community',
            description='A test community',
            creator=self.user,
            is_private=False,
            requires_approval=False
        )
        
        # Create admin membership for user
        Membership.objects.create(
            user=self.user,
            community=self.community,
            role='admin',
            status='approved'
        )
        
        # Create a test post
        self.post = Post.objects.create(
            title='Test Post',
            content='This is a test post',
            community=self.community,
            author=self.user,
            post_type='discussion'
        )
        
        # Create client and authenticate
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_list_posts(self):
        """Test listing posts in a community"""
        url = reverse('community-posts-list', kwargs={'community_slug': 'test-community'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Post')
    
    def test_create_post(self):
        """Test creating a new post"""
        url = reverse('community-posts-list', kwargs={'community_slug': 'test-community'})
        data = {
            'title': 'New Test Post',
            'content': 'This is a new test post',
            'post_type': 'discussion'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 2)
        self.assertEqual(Post.objects.get(title='New Test Post').content, 'This is a new test post')
    
    def test_upvote_post(self):
        """Test upvoting a post"""
        url = reverse('community-posts-upvote', kwargs={
            'community_slug': 'test-community',
            'pk': self.post.id
        })
        
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.post.upvotes.count(), 1)
        self.assertTrue(self.post.upvotes.filter(id=self.user.id).exists())
    
    def test_pin_post(self):
        """Test pinning a post"""
        url = reverse('community-posts-toggle-pin', kwargs={
            'community_slug': 'test-community',
            'pk': self.post.id
        })
        
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Post.objects.get(id=self.post.id).is_pinned)


class CommentTests(APITestCase):
    """Test comment-related functionality"""
    
    def setUp(self):
        # Create test users
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test community
        self.community = Community.objects.create(
            name='Test Community',
            slug='test-community',
            description='A test community',
            creator=self.user,
            is_private=False,
            requires_approval=False
        )
        
        # Create admin membership for user
        Membership.objects.create(
            user=self.user,
            community=self.community,
            role='admin',
            status='approved'
        )
        
        # Create a test post
        self.post = Post.objects.create(
            title='Test Post',
            content='This is a test post',
            community=self.community,
            author=self.user,
            post_type='discussion'
        )
        
        # Create a test comment
        self.comment = Comment.objects.create(
            post=self.post,
            author=self.user,
            content='This is a test comment'
        )
        
        # Create client and authenticate
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_list_comments(self):
        """Test listing comments on a post"""
        url = reverse('post-comments-list', kwargs={
            'community_slug': 'test-community',
            'post_pk': self.post.id
        })
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['content'], 'This is a test comment')
    
    def test_create_comment(self):
        """Test creating a new comment"""
        url = reverse('post-comments-list', kwargs={
            'community_slug': 'test-community',
            'post_pk': self.post.id
        })
        data = {
            'content': 'This is a new test comment'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 2)
        self.assertEqual(Comment.objects.filter(content='This is a new test comment').count(), 1)
    
    def test_upvote_comment(self):
        """Test upvoting a comment"""
        url = reverse('post-comments-upvote', kwargs={
            'community_slug': 'test-community',
            'post_pk': self.post.id,
            'pk': self.comment.id
        })
        
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.comment.upvotes.count(), 1)
        self.assertTrue(self.comment.upvotes.filter(id=self.user.id).exists())
    
    def test_create_reply(self):
        """Test creating a reply to a comment"""
        url = reverse('post-comments-list', kwargs={
            'community_slug': 'test-community',
            'post_pk': self.post.id
        })
        data = {
            'content': 'This is a reply to the test comment',
            'parent': self.comment.id
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 2)
        self.assertEqual(self.comment.replies.count(), 1)
        self.assertEqual(self.comment.replies.first().content, 'This is a reply to the test comment')
