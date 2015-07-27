var hippie = require("hippie"),
	app = require("../lib/app"),
	array = require("retsu");

function api () {
	return hippie().base("http://localhost:8090").expectHeader("Content-Type", "application/json").json();
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
				.expectValue("links", [])
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
				.expectValue("data", {instruction: "POST your 'firstname', 'lastname', 'email', & 'password' to register"})
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