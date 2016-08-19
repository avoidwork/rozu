module.exports = function (grunt) {
	grunt.initConfig({
		eslint: {
			target: ["index.js", "lib/*.js"]
		},
		mochaTest : {
			options: {
				reporter: "spec"
			},
			test : {
				src : ["test/*_test.js"]
			}
		},
		nsp: {
			package: grunt.file.readJSON("package.json")
		},
		watch : {
			js : {
				files : "lib/*.js",
				tasks : "default"
			},
			pkg: {
				files : "package.json",
				tasks : "default"
			},
			readme : {
				files : "README.md",
				tasks : "default"
			}
		}
	});

	// tasks
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-mocha-test");
	grunt.loadNpmTasks("grunt-nsp");
	grunt.loadNpmTasks("grunt-contrib-watch");

	// aliases
	grunt.registerTask("test", ["eslint", "mochaTest", "nsp"]);
	grunt.registerTask("default", ["test"]);
};
