from django.contrib import admin
from .models import Community, Membership, Post, Comment, CommunityInvitation

class MembershipInline(admin.TabularInline):
    model = Membership
    extra = 0
    raw_id_fields = ['user']

class PostInline(admin.TabularInline):
    model = Post
    extra = 0
    raw_id_fields = ['author']
    show_change_link = True
    fields = ('title', 'author', 'post_type', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'creator', 'created_at', 'is_private', 'requires_approval', 'member_count')
    list_filter = ('category', 'is_private', 'requires_approval', 'created_at')
    search_fields = ('name', 'description', 'tags')
    prepopulated_fields = {'slug': ('name',)}
    raw_id_fields = ('creator',)
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    inlines = [MembershipInline, PostInline]

@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'community', 'role', 'status', 'joined_at')
    list_filter = ('role', 'status', 'joined_at')
    search_fields = ('user__username', 'user__email', 'community__name')
    raw_id_fields = ('user', 'community')
    readonly_fields = ('joined_at', 'updated_at')
    date_hierarchy = 'joined_at'

class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    raw_id_fields = ['author', 'parent']
    readonly_fields = ('created_at',)

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'community', 'post_type', 'created_at', 'is_pinned', 'upvote_count', 'comment_count')
    list_filter = ('post_type', 'created_at', 'is_pinned')
    search_fields = ('title', 'content', 'author__username', 'community__name')
    raw_id_fields = ('author', 'community')
    readonly_fields = ('created_at', 'updated_at', 'upvote_count', 'comment_count')
    date_hierarchy = 'created_at'
    inlines = [CommentInline]
    
    def upvote_count(self, obj):
        return obj.upvotes.count()
    
    def comment_count(self, obj):
        return obj.comments.count()

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'author', 'post', 'created_at', 'is_reply', 'upvote_count')
    list_filter = ('created_at',)
    search_fields = ('content', 'author__username', 'post__title')
    raw_id_fields = ('author', 'post', 'parent')
    readonly_fields = ('created_at', 'updated_at', 'upvote_count')
    date_hierarchy = 'created_at'
    
    def upvote_count(self, obj):
        return obj.upvotes.count()
    
    def is_reply(self, obj):
        return obj.parent is not None
    is_reply.boolean = True

@admin.register(CommunityInvitation)
class CommunityInvitationAdmin(admin.ModelAdmin):
    list_display = ('community', 'invitee_email', 'inviter', 'status', 'is_sent', 'created_at')
    list_filter = ('status', 'is_sent', 'created_at')
    search_fields = ('invitee_email', 'community__name', 'inviter__username')
    raw_id_fields = ('community', 'inviter')
    readonly_fields = ('created_at', 'updated_at')
