<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
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
        .code-container {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #4f46e5;
            font-family: monospace;
        }
        .expiry {
            font-size: 14px;
            color: #6b7280;
            margin-top: 10px;
        }
        .warning {
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

        <h1>Hello {{ $user->name }},</h1>

        <p>You're attempting to log in to your account. Please use the verification code below to complete your login:</p>

        <div class="code-container">
            <div class="code">{{ $twoFactorCode->code }}</div>
            <p class="expiry">This code will expire in {{ $expiresInMinutes }} minutes</p>
        </div>

        <div class="warning">
            <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask you for this code.
        </div>

        <p>If you did not attempt to log in, please ignore this email or contact support if you believe your account may be compromised.</p>

        <div class="footer">
            <p>This is an automated message from Ekuep Quotation System.</p>
            <p>&copy; {{ date('Y') }} Ekuep Quotation System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
