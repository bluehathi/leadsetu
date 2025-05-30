<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Workspace extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        
    ];
    protected $table = 'workspaces';
    protected $primaryKey = 'id';

    public function owners()
    {
        return $this->belongsToMany(User::class, 'workspace_owners');
    }
}
