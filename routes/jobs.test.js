"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job.js");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u4Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);



/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("Get all jobs", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "j1",
                        salary: 100000,
                        equity: "0.1",
                        companyHandle: "c1"
                    },
                    {
                        title: "j2",
                        salary: 150000,
                        equity: "0.1",
                        companyHandle: "c1"
                    },
                    {
                        title: "j3",
                        salary: 100000,
                        equity: "0.1",
                        companyHandle: "c3"
                    },
                ],
        });
    });


    test("Get all jobs filter by title", async function () {
        const resp = await request(app).get("/jobs?title=j1");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "j1",
                        salary: 100000,
                        equity: "0.1",
                        companyHandle: "c1"
                    },
                ],
        });
    });


    test("Get all jobs filter by minSalary", async function () {
        const resp = await request(app).get("/jobs?minSalary=120000");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "j2",
                        salary: 150000,
                        equity: "0.1",
                        companyHandle: "c1"
                    },
                ],
        });
    });


    test("Get all jobs filter by hasEquity", async function () {
        const resp = await request(app).get("/jobs?hasEquity=true");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "j1",
                        salary: 100000,
                        equity: "0.1",
                        companyHandle: "c1"
                    },
                    {
                        title: "j2",
                        salary: 150000,
                        equity: "0.1",
                        companyHandle: "c1"
                    },
                    {
                        title: "j3",
                        salary: 100000,
                        equity: "0.1",
                        companyHandle: "c3"
                    }
                ],
        });
    });


    test("Get all jobs filter by hasEquity and minSalary", async function () {
        const resp = await request(app).get("/jobs?hasEquity=true&minSalary=120000");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "j2",
                        salary: 150000,
                        equity: "0.1",
                        companyHandle: "c1"
                    }
                ],
        });
    });


});



/************************************** GET /jobs by id */


describe("GET /jobs/:id", function () {
    test("works for anon", async function () {


        let jobId = await db.query(`
            SELECT id FROM jobs WHERE title = 'j1';
        `);

        let id = +jobId.rows[0].id;


        const resp = await request(app).get(`/jobs/${id}`);
        expect(resp.body).toEqual({
            job: {
                title: "j1",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1"
            },
        });
    });


    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/123456789`);
        expect(resp.statusCode).toEqual(404);
    });


});




/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {

    test("works for admin", async function () {

        const newJob = {
            title: "new",
            salary: 100000,
            equity: 0.1,
            companyHandle: "c1"
        };

        await Job.create(newJob);


        let jobId = await db.query(`
            SELECT id FROM jobs WHERE title = 'new';
        `);

        let id = +jobId.rows[0].id;


        const resp = await request(app)
            .patch(`/jobs/${id}`)
            .send({
                title: "new-updated",
            })
            .set("authorization", `Bearer ${u4Token}`);
        expect(resp.body).toEqual({
            job: {
                id: id,
                title: "new-updated",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1"
            },
        });
    });


    test("doesn't work for anon", async function () {

        const newJob = {
            title: "new",
            salary: 100000,
            equity: 0.1,
            companyHandle: "c1"
        };

        await Job.create(newJob);


        let jobId = await db.query(`
            SELECT id FROM jobs WHERE title = 'new';
        `);

        let id = +jobId.rows[0].id;


        const resp = await request(app)
            .patch(`/jobs/${id}`)
            .send({
                title: "new-updated",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });


});



/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {

    test("works for users", async function () {

        let jobId = await db.query(`
        SELECT id FROM jobs WHERE title = 'j1';
        `);

        let id = +jobId.rows[0].id;

        const resp = await request(app)
            .delete(`/jobs/${id}`)
            .set("authorization", `Bearer ${u4Token}`);
        expect(resp.body).toEqual({ deleted: `${id}` });
    });


    test("unauth for anon", async function () {
        let jobId = await db.query(`
        SELECT id FROM jobs WHERE title = 'j2';
        `);

        let id = +jobId.rows[0].id;

        const resp = await request(app)
            .delete(`/jobs/${id}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/1233456789`)
            .set("authorization", `Bearer ${u4Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
