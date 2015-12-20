var hippie = require("hippie"),
	app = require("../lib/app"),
	array = require("retsu"),
	csrf = 'x-csrf-token',
	token;

app.server.config.logs.stdout = false;

function persistCookies (opts, next) {
	opts.jar = true;
	next( opts );
}

function api () {
	return hippie().base("http://localhost:8090").use(persistCookies).expectHeader("Content-Type", "application/json").json();
}

function get_token (fn, url) {
	return api().get(url || "/login").end(fn);
}

describe("Public", function () {
	describe("GET / returns Array of public APIs", function () {
		it("returns an array of endpoints", function (done) {
			api()
				.get("/")
				.expectStatus(200)
				.expectHeader("allow", "GET, HEAD, OPTIONS")
				.expectValue("links", [
					{uri: '/login', rel: 'item'},
					{uri: '/receive', rel: 'item'},
					{uri: '/register', rel: 'item'}
				])
				.expectValue("data", ['login', 'receive', 'register'])
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function (err) {
					if (err) {
						throw err;
					}
					done();
				});
		});
	});

	describe("GET /login returns instructions", function () {
		it("returns an object with instructions", function (done) {
			api()
				.get("/login")
				.expectStatus(200)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("links", [
					{uri: '/', rel: 'collection'}
				])
				.expectValue("data", {instruction: "POST 'username' & 'password' to authenticate"})
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function (err) {
					if (err) {
						throw err;
					}
					done();
				});
		});
	});

	describe("GET /receive returns instructions", function () {
		it("returns an object with instructions", function (done) {
			api()
				.get("/receive")
				.expectStatus(200)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("links", [
					{uri: '/', rel: 'collection'}
				])
				.expectValue("data", {instruction: "POST must include valid token"})
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function (err) {
					if (err) {
						throw err;
					}
					done();
				});
		});
	});

	describe("POST /receive returns instructions", function () {
		it("returns an object with instructions", function (done) {
			api()
				.post("/receive")
				.send({token: "abc", message: "Hello World"})
				.expectStatus(401)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("links", [
					{uri: '/', rel: 'collection'}
				])
				.expectValue("data", null)
				.expectValue("error", "Unauthorized")
				.expectValue("status", 401)
				.end(function (err) {
					if (err) {
						throw err;
					}
					done();
				});
		});
	});

	describe("GET /register returns instructions", function () {
		it("returns an object with instructions", function (done) {
			api()
				.get("/register")
				.expectStatus(200)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("links", [
					{uri: '/', rel: 'collection'}
				])
				.expectValue("data", {instruction: "POST your 'firstname', 'lastname', 'email', & 'password' to register; password must be 8-20 mixed case alpha-numeric characters"})
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function (err) {
					if (err) {
						throw err;
					}
					done();
				});
		});
	});

	describe("POST /register (csrf error)", function () {
		it("returns an object with an error", function (done) {
			api()
				.post("/register")
				.form()
				.send({firstname: "John", lastname: "Doe", email: "jdoe@nowhere", password: 'blahBlah1'})
				.expectStatus(403)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("data", null)
				.expectValue("error", "CSRF token missing")
				.expectValue("status", 403)
				.end(function (err) {
					if (err) {
						throw err;
					}
					done();
				});
		});
	});

	describe("POST /register success", function () {
		it("returns an object with instructions", function (done) {
			get_token(function (err, res) {
				if (err) {
					throw err;
				}

				token = res.headers[csrf];
				api()
					.header(csrf, token)
					.post("/register")
					.form()
					.send({firstname: "John", lastname: "Doe", email: "jdoe@nowhere", password: "blahBlah1"})
					.json()
					.expectStatus(200)
					.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
					.expectValue("error", null)
					.expectValue("status", 200)
					.end(function (err) {
						if (err) {
							throw err;
						}

						done();
					});
			});
		});
	});
});