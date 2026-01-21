from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.UserProfileView.as_view(), name="user-profile"),
    path("update/", views.UpdateProfileView.as_view(), name="update-profile"),
    path("create/", views.UserProfileCreateView.as_view(), name="create-profile"),
    path("profile/", views.UserProfileDetailView.as_view(), name="user-profile-detail"),
    path("profile/update/", views.UserProfileUpdateView.as_view(), name="update-profile-detail"),
    path("bulk-update/", views.BulkProfileUpdateView.as_view(), name="bulk-update-profile"),
    path("dashboard/", views.UserDashboardView.as_view(), name="user-dashboard"),
    path("csrf/", views.GetCSRFToken.as_view(), name="csrf-token"),
    path("forgot-password/", views.ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", views.PasswordResetConfirmView.as_view(), name="reset-password"),
    path(
        "validate-reset-token/",
        views.ValidateResetTokenView.as_view(),
        name="validate-reset-token",
    ),
    path('current-user/', views.CurrentUserView.as_view(), name='current_user'),
    path('check-session/', views.CheckSessionView.as_view(), name='check_session'),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("delete-account/", views.DeleteAccountView.as_view(), name="delete-account"),
    
    # Verification URLs
    path('verify-email/', views.VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', views.ResendVerificationEmailView.as_view(), name='resend-verification'),
    path('verification-status/', views.CheckVerificationStatusView.as_view(), name='verification-status'),
    path("verification-status/", views.VerificationStatusView.as_view(), name="verification-status"),
    path("verify-email/status/", views.VerificationStatusView.as_view(), name="email-verification-status"),
    path("verify-phone/status/", views.VerificationStatusView.as_view(), name="phone-verification-status"),
    
    # Validation URLs
    path("validate-phone/", views.ValidatePhoneNumberView.as_view(), name="validate-phone"),
    path("validate-profile/", views.ValidateProfileView.as_view(), name="validate-profile"),
    
    # Privacy and settings URLs
    path("privacy-settings/", views.PrivacySettingsView.as_view(), name="privacy-settings"),
    path("account-activity/", views.AccountActivityView.as_view(), name="account-activity"),
    path("export-data/", views.ExportDataView.as_view(), name="export-data"),

    # User activity URLs
    path("activities/", views.UserActivitiesView.as_view(), name="user-activities"),
    path("activities/create/", views.CreateUserActivityView.as_view(), name="create-activity"),
    path("activities/summary/", views.UserActivitySummaryView.as_view(), name="activity-summary"),
    path('debug-session/', views.DebugSessionView.as_view(), name='debug_session'),
]
