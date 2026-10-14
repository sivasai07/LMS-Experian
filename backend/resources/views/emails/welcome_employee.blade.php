<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Welcome to Leave Management System</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f6f9; color: #333333; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #2563eb; margin-top: 0;">Welcome to Leave Management System</h2>
        <p>Dear {{ $employeeName }},</p>
        <p>Welcome aboard! Your employee account has been successfully created. You can now log into the Leave Management Portal to submit leave requests, view your leave balance, and check holidays.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 5px 0;"><strong>Employee ID:</strong> {{ $employeeId }}</p>
            <p style="margin: 5px 0;"><strong>Registered Email:</strong> {{ $registeredEmail }}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code>{{ $tempPassword }}</code></p>
        </div>

        <p>For security purposes, you will be prompted to change your temporary password upon your first login.</p>

        <p><a href="{{ $loginUrl }}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 15px;">Log In to Portal</a></p>

        <div style="margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            <p>This is an automated message from the Leave Management System. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
