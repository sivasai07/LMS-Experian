<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * Class WelcomeEmployeeMail
 *
 * Handles the welcome email notification sent to newly registered employees.
 *
 * Responsibilities:
 * - Sends initial account access details to newly created employees.
 * - Provides employee identification details and login instructions.
 * - Supports queue processing for scalable email delivery.
 *
 * Design:
 * - Email content is maintained inside the dedicated Blade email view.
 * - Authentication and user creation logic remain within their respective services.
 * - This mailable is responsible only for preparing email data and metadata.
 *
 * Queue Behavior:
 * - Implements ShouldQueue to support asynchronous email delivery.
 * - Works synchronously with the current sync queue driver.
 * - Automatically becomes asynchronous when a production queue driver is configured.
 */
class WelcomeEmployeeMail extends Mailable implements ShouldQueue
{
    use Queueable;

    /**
     * Employee instance receiving the welcome email.
     */
    public User $user;

    /**
     * Temporary plain-text password generated during account creation.
     */
    public string $plainPassword;

    /**
     * Application login URL.
     */
    public string $loginUrl;

    /**
     * Create a new welcome employee email instance.
     *
     * @param User $user Employee receiving the email.
     * @param string $plainPassword Temporary login password.
     * @param string $loginUrl Application login URL.
     */
    public function __construct(
        User $user,
        string $plainPassword,
        string $loginUrl = 'http://localhost:3000/login'
    ) {
        $this->user = $user;
        $this->plainPassword = $plainPassword;
        $this->loginUrl = $loginUrl;
    }

    /**
     * Get the email envelope configuration.
     *
     * @return Envelope Email metadata configuration.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to Leave Management System',
        );
    }

    /**
     * Get the email content definition.
     *
     * @return Content Email view configuration and data.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome_employee',
            with: [
                'employeeName' => $this->user->first_name . ' ' . $this->user->last_name,
                'employeeId' => $this->user->employee_number,
                'registeredEmail' => $this->user->email,
                'tempPassword' => $this->plainPassword,
                'loginUrl' => $this->loginUrl,
            ],
        );
    }

    /**
     * Get the attachments for the email.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}