<?php

namespace Tests\Unit;

use App\Models\ActivityLog;
use App\Support\HtmlSanitizer;
use App\Support\WorkspaceContext;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class SecurityHelpersTest extends TestCase
{
    public function test_redact_masks_sensitive_keys_at_any_depth_and_keeps_the_rest(): void
    {
        $out = ActivityLog::redact([
            'email' => 'a@b.test',
            'Password' => 'x',
            'data' => ['new_password_confirmation' => 'y', 'api_key' => 'k', 'list' => [['token' => 't', 'ok' => 1]]],
        ]);

        $this->assertSame('a@b.test', $out['email']);
        $this->assertSame('[redacted]', $out['Password']);
        $this->assertSame('[redacted]', $out['data']['new_password_confirmation']);
        $this->assertSame('[redacted]', $out['data']['api_key']);
        $this->assertSame('[redacted]', $out['data']['list'][0]['token']);
        $this->assertSame(1, $out['data']['list'][0]['ok']);
    }

    #[DataProvider('dangerousHtml')]
    public function test_sanitizer_removes_active_content(string $input, string $mustNotContain): void
    {
        $this->assertStringNotContainsStringIgnoringCase($mustNotContain, HtmlSanitizer::clean($input));
    }

    public static function dangerousHtml(): array
    {
        return [
            'script tag' => ['<p>x</p><script>alert(1)</script>', '<script'],
            'inline handler' => ['<p onclick="steal()">x</p>', 'onclick'],
            'javascript url' => ['<a href="javascript:alert(1)">x</a>', 'javascript:'],
            'iframe' => ['<iframe src="https://evil.test"></iframe>', 'iframe'],
            'data uri image' => ['<img src="data:text/html;base64,PHNjcmlwdD4=">', 'data:'],
            'style expression' => ['<div style="background:url(javascript:alert(1))">x</div>', 'javascript'],
            'form' => ['<form action="https://evil.test"><input name="p"></form>', '<form'],
        ];
    }

    public function test_sanitizer_keeps_basic_formatting_and_safe_links(): void
    {
        $clean = HtmlSanitizer::clean('<h1>Hi</h1><p><strong>bold</strong> <a href="https://example.com/x" target="_blank">link</a></p><ul><li>one</li></ul>');

        $this->assertStringContainsString('<strong>bold</strong>', $clean);
        $this->assertStringContainsString('href="https://example.com/x"', $clean);
        $this->assertStringContainsString('<li>one</li>', $clean);
    }

    public function test_workspace_context_is_scoped_and_restored_even_on_errors(): void
    {
        $this->assertNull(WorkspaceContext::id());

        $this->assertSame(5, WorkspaceContext::run(5, fn () => WorkspaceContext::id()));
        $this->assertSame(7, WorkspaceContext::run(5, fn () => WorkspaceContext::run(7, fn () => WorkspaceContext::id())));
        $this->assertSame(5, WorkspaceContext::run(5, function () {
            WorkspaceContext::run(9, fn () => null);

            return WorkspaceContext::id();
        }));

        try {
            WorkspaceContext::run(3, fn () => throw new \RuntimeException('boom'));
        } catch (\RuntimeException) {
        }
        $this->assertNull(WorkspaceContext::id());
    }
}
