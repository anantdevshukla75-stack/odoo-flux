# API

## Authentication

| Method | Endpoint                | Purpose               |
| ------ | ----------------------- | --------------------- |
| `POST` | `/auth/register`        | Customer Registration |
| POST   | `/auth/login`           | Login                 |
| POST   | `/auth/refresh`         | Refresh access token  |
| POST   | `/auth/logout`          | Logout                |
| POST   | `/auth/forgot-password` | Request reset link    |
| POST   | `/auth/reset-password`  | Reset password        |
| POST   | `/auth/staff`           | Admin creates staff   |

`UserCreate`

```json
{
    "email": "customer@example.com",
    "password": "|asdasfd",
    "full_name": "UserName"
}
```

`UserCreateResponse`

```json
{
    "id": 1,
    "email": "customer@example.com",
    "password": "|asdasfd",
    "full_name": "UserName"
}
```

`UserLogin`

```json
{
    "email": "user@example.com",
    "password": "asfsdfsd"
}
```

`UserLoginResponse`

```json
{
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "bearer"
}
```

## JWT TOKEN

`JWT`

```json
{
  "sub": "1",
  "role": "customer",
  "exp": 1793450000
}
```