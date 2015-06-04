# Rozu

[![build status](https://secure.travis-ci.org/avoidwork/rozu.svg)](http://travis-ci.org/avoidwork/rozu)

RESTful Webhook API in node.js, with MongoDB for persistent storage. 

Each response will include a `Link` header, and an `Array` of `Objects` with `IANA` defined `rel` properties & URIs.

## Getting Started
The following steps outline how the system is intended to be utilized.

- Register an account
- Verify account
- Login with account
- Create a webhook by registering the remote host


## Registration
To register, make a `GET` request to `/register` to retrieve instructions.

Registration is a two step process, requiring email verification. Please fill out `email` in `config.json`.

## Authentication
To authenticate, make a `GET` request to `/login` to retrieve instructions.

To logout, make a `GET` request to `/logout`.

## Your Profile
Make a `GET` request to `/profile`. You will have CRUD operations, defined by the `allow` header.

## Getting Administrator Access
Once authenticated, make `GET` request to `/admin`; this requires your account email address in the `admin` Array in `config.json`.

## Routes
A `GET` request to `/` will return different results, depending upon the state of your session.

### Unauthenticated

```json
{
	"status": 200,
	"error": null,
	"data": {
		"link": [
			{
				"rel": "item",
				"uri": "http://localhost:8080/login"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8080/register"
			}
		],
		"result": [
			"/login",
			"/register"
		]
	}
}
```

### Authenticated

```json
{
	"status": 200,
	"error": null,
	"data": {
		"link": [
			{
				"rel": "item",
				"uri": "http://localhost:8080/admin"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8080/logout"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8080/profile"
			}
			{
				"rel": "item",
				"uri": "http://localhost:8080/users"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8080/webhooks"
			}
		],
		"result": [
			"/admin",
			"/logout",
			"/profile",
			"/users",
			"/webhooks"
		]
	}
}
```

## Receiving webhook events
Rozu has a publically accessible route `/receive` which will accept a JSON or form encoded payload & put it into **Redis**
for pub/sub behavior in your local stack. Inbound requests must include a user specified token (`token` in `config.json`)
which maps to a user owned webhook; tokens are v1 UUIDs.

## Requirements
- node.js or io.js
- MongoDB
- Redis
- nginx for SSL termination / reverse proxy is ideal for public servers

## License
Copyright (c) 2015 Jason Mulligan  
All Rights Reserved