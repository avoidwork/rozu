# Rozu
Rozu is a webhook API server, using MongoDB for persistent storage & Redis for pub/sub of inbound events

![demo graphic](https://farm9.staticflickr.com/8892/18285216659_3508c5ed9f_o.png "rozu demo")

[![build status](https://secure.travis-ci.org/avoidwork/rozu.svg)](http://travis-ci.org/avoidwork/rozu)

Each response will include a `Link` header, and an `Array` of `Objects` with `IANA` defined `rel` properties & URIs.

## Receiving webhook events
Rozu has a publically accessible route `/receive` which will accept a JSON or form encoded payload & put it into **Redis**
for pub/sub behavior in your local stack. Inbound requests must include a user supplied token (`token` in `config.json`)
which maps to a registered webhook; tokens are v1 UUIDs.

Inbound events will be published with a channel name of `config.id_webhook.name`, e.g. "rozu_github".

## Sending webhook events
Sending a webhook is as easy as publishing into Redis with a channel name of `config.id_webhook.name_send`,
e.g. "rozu_github_send", or POST to `/send` after authenticating at `/login`. Outbound webhook properties to configure
the request are `method`, & `encoding`. If not specified, `method` will default to `POST`, & `encoding` will default to
`json` if the channel message is transmitted as `JSON`; `encoding` can be `json`, `querystring`, or `form`.

The request body will contain the webhook id as the value of `config.token`, for validation.

## Requirements
- node.js or io.js
- MongoDB (persistent storage of accounts, & webhook configurations)
- Redis (pub/sub for local stack of inbound events)
- (Optional) nginx for SSL termination, & reverse proxy

## How do I run Rozu?
`Rozu` can be up and running in 3 steps! When run in a production environment, it's recommended that you use `nginx`
to terminate SSL, and reverse proxy to `Rozu`. Using a daemon like `upstart` (on Linux) to run `rozu` is ideal. 

1.  Clone [this](https://github.com/avoidwork/rozu) repository, or install from `npm`:
    1.  `$ npm install rozu`
    2.  `$ ln -s node_modules/rozu/config.json config.json`
    3.  `$ ln -s node_modules/rozu/lib/app.js app.js`
2.  Edit `config.json` to configure your email server, etc.
3.  Run via `node index.js`
4.  (Optional) Use the provided upstart recipe: `sudo cp node_modules/rozu/rozu.conf /etc/init & service start rozu`

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
				"uri": "http://localhost:8090/login"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8090/receive"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8090/register"
			}
		],
		"result": [
			"/login",
			"/receive",
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
				"uri": "http://localhost:8090/admin"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8090/logout"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8090/profile"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8090/receive"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8090/send"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8090/stream"
			}
			{
				"rel": "item",
				"uri": "http://localhost:8090/users"
			},
			{
				"rel": "item",
				"uri": "http://localhost:8090/webhooks"
			}
		],
		"result": [
			"/admin",
			"/logout",
			"/profile",
			"/receive",
			"/send",
			"/stream",
			"/users",
			"/webhooks"
		]
	}
}
```

## License
Copyright (c) 2015 Jason Mulligan  
All Rights Reserved
