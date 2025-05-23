<?php

namespace Tests\Browser;

use App\Models\User;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ColumnPreferencesTest extends DuskTestCase
{
    public function test_user_can_toggle_leads_table_columns()
    {
        $user = User::factory()->create([
            'email' => 'testuser2@example.com',
            'password' => bcrypt('password'),
        ]);

        $this->browse(function (Browser $browser) use ($user) {
            $browser->loginAs($user)
                ->visit('/leads')
                ->click('@show-hide-columns-button') // Add dusk selector to your button
                ->uncheck('@column-title-checkbox') // Add dusk selectors to checkboxes
                ->pause(500)
                ->assertDontSee('Title')
                ->check('@column-title-checkbox')
                ->pause(500)
                ->assertSee('Title');
        });
    }
} 