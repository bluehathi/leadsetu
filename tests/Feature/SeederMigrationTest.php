<?php

namespace Tests\Feature;

use Tests\TestCase;

class SeederMigrationTest extends TestCase
{
    public function test_migrations_and_seeders_run_without_error()
    {
        $this->artisan('migrate:fresh')->assertExitCode(0);
        $this->artisan('db:seed')->assertExitCode(0);
    }
} 