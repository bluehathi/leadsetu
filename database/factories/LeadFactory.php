<?php

namespace Database\Factories;

use App\Models\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'company' => $this->faker->company(),
            'website' => $this->faker->url(),
            'notes' => $this->faker->sentence(),
            'status' => 'new',
            'source' => 'website',
            'score' => 50,
            'qualification' => 'Warm',
            'user_id' => 1,
            'organization_id' => 1,
            'title' => $this->faker->jobTitle(),
            'positions' => $this->faker->word(),
            'tags' => ['demo'],
            'deal_value' => 1000,
            'expected_close' => now()->addMonth(),
            'lead_score' => 50,
            'lead_owner' => 1,
            'priority' => 'medium',
            'attachments' => [],
        ];
    }
} 