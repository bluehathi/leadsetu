<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->company,
            'description' => $this->faker->catchPhrase,
            'website' => $this->faker->url,
            'workspace_id' => Workspace::factory(),
        ];
    }
}
