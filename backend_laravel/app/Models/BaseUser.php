<?php

namespace App\Models;

class BaseUser
{
    public int $userId;
    public string $username;
    public string $password;
    public string $role;

    public function login()
    {
        echo $this->username . " login\n";
    }

    public function logout()
    {
        echo $this->username . " logout\n";
    }
}