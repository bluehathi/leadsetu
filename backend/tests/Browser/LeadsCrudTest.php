<?php

namespace Tests\Browser;

use App\Models\User;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class LeadsCrudTest extends DuskTestCase
{
    public function test_lead_crud_flow()
    {
        $user = User::factory()->create([
            'email' => 'duskuser@example.com',
            'password' => bcrypt('password'),
        ]);
        $this->browse(function (Browser $browser) use ($user) {
            $browser->visit('/login')
                ->type('email', $user->email)
                ->type('password', 'password')
                ->press('Login')
                ->visit('/leads/create')
                ->type('name', 'Dusk Lead')
                ->type('email', 'dusklead@example.com')
                ->type('company', 'Dusk Co')
                ->press('Save')
                ->assertPathIs('/leads')
                ->assertSee('Dusk Lead')
                ->click('@show-hide-columns-button')
                ->uncheck('@column-title-checkbox')
                ->pause(500)
                ->assertDontSee('Title')
                ->logout();
        });
    }
} 