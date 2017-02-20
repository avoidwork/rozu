const tinyhttptest = require("tiny-httptest"),
	app = require("../index.js"),
	csrf = "x-csrf-token",
	rnd = Math.floor(Math.random() * (1e8 - 1)) + 1,
	FIRSTNAME = "John",
	LASTNAME = "Doe",
	EMAIL = "jdoe_" + rnd + "@nowhere",
	PASSWORD = "blahBlah1@";

app.server.config.logging.enabled = false;

describe("Public", function () {
	describe("GET / returns Array of public APIs", function () {
		it("returns an array of endpoints", function () {
			return tinyhttptest({url: "http://localhost:8090"})
				.cookies()
				.expectStatus(200)
				.expectHeader("allow", "GET, HEAD, OPTIONS")
				.expectValue("links", [
					{uri: "/login", rel: "item"},
					{uri: "/receive", rel: "item"},
					{uri: "/register", rel: "item"}
				])
				.expectValue("data", ["login", "receive", "register"])
				.expectValue("error", null)
				.expectValue("status", 200)
				.end();
		});
	});

	describe("GET /login returns instructions", function () {
		it("returns an object with instructions", function () {
			return tinyhttptest({url: "http://localhost:8090/login"})
				.cookies()
				.expectStatus(200)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("links", [
					{uri: "/", rel: "collection"}
				])
				.expectValue("data", {instruction: "POST 'username' & 'password' to authenticate"})
				.expectValue("error", null)
				.expectValue("status", 200)
				.end();
		});
	});

	describe("GET /receive returns instructions", function () {
		it("returns an object with instructions", function () {
			return tinyhttptest({url: "http://localhost:8090/receive"})
				.cookies()
				.expectStatus(200)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("links", [
					{uri: "/", rel: "collection"}
				])
				.expectValue("data", {instruction: "POST must include valid token"})
				.expectValue("error", null)
				.expectValue("status", 200)
				.end();
		});
	});

	describe("POST /receive returns instructions", function () {
		it("returns an object with an error", function () {
			return tinyhttptest({url: "http://localhost:8090/receive", method: "post"})
				.json({token: "abc", message: "Hello World"})
				.cookies()
				.expectStatus(401)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("links", [
					{uri: "/", rel: "collection"}
				])
				.expectValue("data", null)
				.expectValue("error", "Unauthorized")
				.expectValue("status", 401)
				.end();
		});
	});

	describe("GET /register returns instructions", function () {
		it("returns an object with instructions", function () {
			return tinyhttptest({url: "http://localhost:8090/register"})
				.cookies()
				.expectStatus(200)
				.captureHeader(csrf)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("links", [
					{uri: "/", rel: "collection"}
				])
				.expectValue("data", {instruction: "POST your 'firstname', 'lastname', 'email', & 'password' to register; password must be 8-20 mixed case alpha, numeric & special characters"})
				.expectValue("error", null)
				.expectValue("status", 200)
				.end();
		});
	});

	describe("POST /register (csrf error)", function () {
		it("returns an object with an error", function () {
			return tinyhttptest({url: "http://localhost:8090/register", method: "post"})
				.json({firstname: FIRSTNAME, lastname: LASTNAME, email: EMAIL, password: PASSWORD})
				.cookies()
				.expectStatus(403)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("data", null)
				.expectValue("error", "CSRF token missing")
				.expectValue("status", 403)
				.end();
		});
	});

	describe("POST /register success", function () {
		it("returns an object with instructions", function () {
			return tinyhttptest({url: "http://localhost:8090/register", method: "post"})
				.cookies()
				.reuseHeader(csrf)
				.json({firstname: FIRSTNAME, lastname: LASTNAME, email: EMAIL, password: PASSWORD})
				.expectStatus(200)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("error", null)
				.expectValue("status", 200)
				.end();
		});
	});

	describe("POST /register (duplicate email error)", function () {
		it("returns an object with an error", function () {
			return tinyhttptest({url: "http://localhost:8090/register", method: "post"})
				.cookies()
				.reuseHeader(csrf)
				.json({firstname: FIRSTNAME, lastname: LASTNAME, email: EMAIL, password: PASSWORD})
				.expectStatus(400)
				.expectHeader("allow", "GET, HEAD, OPTIONS, POST")
				.expectValue("data", null)
				.expectValue("status", 400)
				.end();
		});
	});
});
