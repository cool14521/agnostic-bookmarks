// =============================================================================
//  This file defines unit tests for the endpoint /api/bookmarks. These
//  tests connect to an actual database, so be sure to specify a testing
//  database if you are running them on an environment with important data.
// -----------------------------------------------------------------------------
//  NOTE: Before running your tests, ensure your testing database is empty,
//        otherwise tests can fail and even hung.
// =============================================================================
process.env.NODE_ENV = 'test';  // Set environment to testing
process.env.PORT = 3000;        // Set port to 3000

var mongoose = require('mongoose');
var request  = require('request');
var server;
var config   = require('../app/config');
var Bookmark = require('../app/bookmark-model');
var User     = require('../app/user-model');
var baseURL  = 'http://localhost:' + process.env.PORT + '/api/bookmarks/';

describe("PATCH /api/bookmarks/{bookmarkID}", function() {

    var dummyUser = {};
    var dummyBookmark = {};

    beforeEach(function() {
        // Launch server
        var connected = false;
        runs(function() {
            // Replace console.log with a mock that won't do anything, so our
            // test will look clean and pretty
            spyOn(console, "log");
            // Start the server
            if (server == null) server = require('../index.js');
            try {
                server.start(function() { connected = true; });
            } catch(err) {
                if (err.message != "Trying to open unclosed connection.") throw err
                else connected = true;
            }
        })
        waitsFor(function() { return connected }, "server start", 1000);

        // Add a dummy user
        dummyUser = { username: 'dummy', password: 'dummy' };
        var userAdded = false;
        runs(function() {
            new User(dummyUser).save(function(err, data) {
                if (err) { console.log(err); userAdded = true; return; }
                dummyUser = data;
                userAdded = true;
            })
        });
        waitsFor(function() { return userAdded; }, "dummy user creation", 1500);

        // Add some bokomarks
        var done = false;
        runs(function addBookmark1() {
            new Bookmark({
                url: "http://dummy0.com",
                name: "Dummy 0",
                owner: dummyUser._id,
                description: "Original description",
                tags: ["tag1", "tag2"],
            }).save(function(error, data) {
                if (error) console.log(error);
                dummyBookmark = data;
                done = true;
            })
        })
        waitsFor(function() { return done; }, "User1's bookmarks creation", 2000);

        done = false;
        runs(function addBookmark1() {
            new Bookmark({
                url: "http://dummy1.com",
                name: "Dummy 1",
                owner: dummyUser._id,
            }).save(function(error, data) {
                if (error) console.log(error);
                aaaBookmark = data;
                done = true;
            })
        })
        waitsFor(function() { return done; }, "User1's bookmarks creation", 2000);
    });

    afterEach(function() {
        var done = false;
        var timeout = 1000;
        // Clean database
        var cleaned = false;
        runs(function() {
            mongoose.connection.db.dropDatabase(function() { cleaned = true; });
        })
        waitsFor(function() { return cleaned; }, "mongoose data cleaning", 1000);
        // Close server
        runs(function() {
            server.close(function() {
                done = true;
            });
        })
        waitsFor(function() {
            return done;
        }, "closing server", timeout);
    })

    it('should update an existing bookmark if valid data is supplied', function() {
        var done = false;
        var error, response, result;
        runs(function() {
            request.patch({
                url: baseURL + dummyBookmark._id,
                auth: { username: "dummy", password: "dummy" },
                json: true,
                body: {
                    url: "http://newDummy.com",
                    name: "New dummy 0",
                    description: "New description",
                    tags: ["newTag1"]
                }
            }, function(_error, _response, _body) {
                error = _error;
                response = _response;
                result = _body;
                done = true;
            });
        });
        waitsFor(function() { return done; }, "bookmark creation", 1500);
        runs(function() {
            done = false;
            // Check response
            expect(response.statusCode).toBe(200);
            expect(result._id).toEqual(dummyBookmark._id.toString());
            expect(result.owner).toBe(dummyUser._id.toString());
            expect(result.name).toBe("New dummy 0");
            expect(result.url).toBe("http://newDummy.com");
            expect(result.description).toBe("New description")
            expect(result.tags.length).toBe(1);
            expect(result.tags).toContain("newTag1");
            // Check data is in database
            Bookmark.findById(result._id, function(_error, _data) {
                error = _error;
                result = _data;
                done = true;
            });
        });
        waitsFor(function() { return done; }, "database bookmark check", 1500);
        runs(function() {
            // Check response
            expect(result._id).toEqual(dummyBookmark._id);
            expect(result.owner).toEqual(dummyUser._id);
            expect(result.name).toBe("New dummy 0");
            expect(result.url).toBe("http://newDummy.com");
            expect(result.description).toBe("New description")
            expect(result.tags.length).toBe(1);
            expect(result.tags).toContain("newTag1");
        });
    })

    it('should not update an existing bookmark if used URL is supplied', function() {
        var done = false;
        var error, response, result;
        runs(function() {
            request.patch({
                url: baseURL + dummyBookmark._id,
                auth: { username: "dummy", password: "dummy" },
                json: true,
                body: {
                    url: "http://dummy1.com",
                    name: "New dummy 0",
                    description: "New description",
                    tags: ["newTag1"]
                }
            }, function(_error, _response, _body) {
                error = _error;
                response = _response;
                result = _body;
                done = true;
            });
        });
        waitsFor(function() { return done; }, "bookmark creation", 1500);
        runs(function() {
            done = false;
            // Check response
            expect(response.statusCode).toBe(400);
            // Check data is in database
            Bookmark.findById(dummyBookmark._id, function(_error, _data) {
                error = _error;
                result = _data;
                done = true;
            });
        });
        waitsFor(function() { return done; }, "database bookmark check", 1500);
        runs(function() {
            // Check response
            expect(result._id).toEqual(dummyBookmark._id);
            expect(result.owner).toEqual(dummyUser._id);
            expect(result.name).toBe(dummyBookmark.name);
            expect(result.url).toBe(dummyBookmark.url);
            expect(result.description).toBe(dummyBookmark.description)
            expect(result.tags.length).toBe(dummyBookmark.tags.length);
            expect(result.tags).toContain(dummyBookmark.tags[0]);
            expect(result.tags).toContain(dummyBookmark.tags[1]);
        });
    });

    it('should return not found if no valid _id is supplied', function() {
        var done = false;
        var error, response, result;
        runs(function() {
            request.patch({
                url: baseURL + "invalidId",
                auth: { username: "dummy", password: "dummy" },
                json: true,
                body: {
                    url: "http://newDummy.com",
                    name: "New dummy 0",
                    description: "New description",
                    tags: ["newTag1"]
                }
            }, function(_error, _response, _body) {
                error = _error;
                response = _response;
                result = _body;
                done = true;
            });
        });
        waitsFor(function() { return done; }, "bookmark creation", 1500);
        runs(function() {
            done = false;
            // Check response
            console.log(result);
            expect(response.statusCode).toBe(404);
        });
    });
});
