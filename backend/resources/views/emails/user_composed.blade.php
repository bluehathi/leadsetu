<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {{-- 
        The subject is set in the Mailable's envelope() method.
        The $emailSubject variable passed from the Mailable's constructor 
        is automatically available in the view if not shadowed by another variable,
        but it's best practice to set it in the envelope.
        For the <title> tag, you can access it if needed, or just keep a generic title.
    --}}
    <title>Email</title>
    <style>
        /* You can add very basic inline-compatible CSS here if needed */
        /* For robust HTML emails, consider using dedicated email templating tools or MJML */
        body {
            font-family: sans-serif;
            line-height: 1.6;
            color: #333;
        }
    </style>
</head>
<body>
    {{--
        Render the HTML content directly from the rich text editor or textarea.
        The `{!! !!}` syntax is used to output raw HTML.
        Ensure that if the source of this HTML is ever from a less trusted input
        (not the case here as it's the authenticated user composing for their contact),
        it would need sanitization. For this user-to-contact scenario, it's generally fine.
    --}}
    {!! $htmlContent !!}
</body>
</html>