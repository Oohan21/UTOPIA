from rest_framework import permissions
from real_estate.models import Message, MessageThread

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.owner == request.user

class IsAdminUser(permissions.BasePermission):
    """
    Permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.user_type == 'admin' or
            request.user.is_staff or
            request.user.is_superuser
        )

class CanListProperties(permissions.BasePermission):
    """
    Permission to check if user can list properties.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # All authenticated users can list properties
        return request.user.is_authenticated

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission to allow admin users to edit, others can only read.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to admin users
        return request.user.is_authenticated and (
            request.user.user_type == 'admin' or
            request.user.is_staff or
            request.user.is_superuser
        )

class IsParticipant(permissions.BasePermission):
    """
    Permission to check if user is a participant in the message thread.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'participants'):
            return request.user in obj.participants.all()
        return False


class IsMessageReceiver(permissions.BasePermission):
    """
    Permission to check if user is the receiver of a message.
    """
    def has_object_permission(self, request, view, obj):
        return obj.receiver == request.user


class IsMessageSender(permissions.BasePermission):
    """
    Permission to check if user is the sender of a message.
    """
    def has_object_permission(self, request, view, obj):
        return obj.sender == request.user


class CanSendMessage(permissions.BasePermission):
    """
    Permission to check if user can send a message.
    Prevents users from messaging themselves.
    """
    def has_permission(self, request, view):
        if request.method == 'POST':
            receiver_id = request.data.get('receiver')
            if receiver_id and int(receiver_id) == request.user.id:
                return False
        return True


class CanAccessMessage(permissions.BasePermission):
    """
    Permission to check if user can access a message.
    User must be either sender or receiver.
    """
    def has_object_permission(self, request, view, obj):
        return obj.sender == request.user or obj.receiver == request.user


class CanCreateThread(permissions.BasePermission):
    """
    Permission to check if user can create a message thread.
    """
    def has_permission(self, request, view):
        if request.method == 'POST':
            # Check if all participants exist
            participants = request.data.get('participants', [])
            if not participants or len(participants) < 2:
                return False
            
            # User must be one of the participants
            return request.user.id in participants
        
        return True