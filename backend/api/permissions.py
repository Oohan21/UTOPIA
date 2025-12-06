from rest_framework import permissions

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