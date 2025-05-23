<?php

namespace Tests\Browser;

use App\Models\User;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class LeadsTest extends DuskTestCase
{
    public function test_user_can_add_and_see_lead()
    {
        $user = User::factory()->create([
            'email' => 'testuser@example.com',
            'password' => bcrypt('password'),
        ]);

        $this->browse(function (Browser $browser) use ($user) {
            $browser->visit('/login')
                ->type('email', $user->email)
                ->type('password', 'password')
                ->press('Login')
                ->assertPathIs('/dashboard')
                ->visit('/leads/create')
                ->type('name', 'Test Lead')
                ->type('email', 'lead@example.com')
                ->type('company', 'Test Company')
                ->press('Save')
                ->assertPathIs('/leads')
                ->assertSee('Test Lead')
                ->assertSee('lead@example.com');
        });
    }
} 