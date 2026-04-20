<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
        }
        h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 30px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
        }
        .button:hover {
            background-color: #4338ca;
        }
        .link-fallback {
            background-color: #f3f4f6;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
            word-break: break-all;
            font-size: 12px;
            color: #6b7280;
        }
        .expiry-notice {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
            font-size: 14px;
            color: #92400e;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Ekuep Quotation System</div>
        </div>

        <h1>Password Reset Request</h1>

        <p>Hello {{ $user->name }},</p>

        <p>We received a request to reset the password for your account. Click the button below to set a new password:</p>

        <div class="button-container">
            <a href="{{ $resetUrl }}" class="button">Reset Password</a>
        </div>

        <div class="link-fallback">
            <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
            {{ $resetUrl }}
        </div>

        <div class="expiry-notice">
            <strong>Important:</strong> This link will expire in 60 minutes. If the link expires, you can request a new one from the login page.
        </div>

        <p>If you did not request a password reset, no action is needed — your password will remain unchanged.</p>

        <div class="footer">
            <p>This is an automated message from Ekuep Quotation System.</p>
            <p>&copy; {{ date('Y') }} Ekuep Quotation System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
