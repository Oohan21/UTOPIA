from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('me/', views.UserProfileView.as_view(), name='user-profile'),
    path('update/', views.UpdateProfileView.as_view(), name='update-profile'),  
    path('csrf/', views.GetCSRFToken.as_view(), name='csrf-token'),
]