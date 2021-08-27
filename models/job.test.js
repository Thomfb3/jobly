"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create job", function () {
    const newJob = {
        title: "new",
        salary: 100000,
        equity: 0.1,
        companyHandle: "c1"
    };


    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual(
            {
                title: "new",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1"
            }
        );

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'new'`);

        expect(result.rows).toEqual([
            {
                title: "new",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1"
            },
        ]);
    });

});

/************************************** findAll */


describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
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
                companyHandle: "c2"
            },
            {
                title: "j3",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c3"
            }
        ]);
    });


    test("works: title filter", async function () {
        let q = { "title": "j1" };
        let jobs = await Job.findAll(q);
        expect(jobs).toEqual([
            {
                title: "j1",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1"
            }
        ]);
    });

    test("works: minSalary filter", async function () {
        let q = { "minSalary": 125000 };
        let jobs = await Job.findAll(q);
        expect(jobs).toEqual([
            {
                title: "j2",
                salary: 150000,
                equity: "0.1",
                companyHandle: "c2"
            }
        ]);
    });

    test("works: hasEquity filter", async function () {
        let q = { "hasEquity": true };
        let jobs = await Job.findAll(q);
        expect(jobs).toEqual([
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
                companyHandle: "c2"
            },
            {
                title: "j3",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c3"
            }
        ]);
    });


    test("works: minSalary and hasEquity filter", async function () {
        let q = { "minSalary": 125000, "hasEquity": true };
        let jobs = await Job.findAll(q);
        expect(jobs).toEqual([
            {
                title: "j2",
                salary: 150000,
                equity: "0.1",
                companyHandle: "c2"
            }
        ]);
    });

});

/************************************** get */

describe("get job", function () {
    test("works", async function () {

        let jobId = await db.query(`
            SELECT id FROM jobs WHERE title = 'j1';
        `);

        let job = await Job.get(jobId.rows[0].id);
        expect(job).toEqual({
            title: "j1",
            salary: 100000,
            equity: "0.1",
            companyHandle: "c1"
        });
    });

    test("not found if no such company", async function () {
        try {
            await Job.get(1234567);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "j1",
        salary: 120000,
        equity: 0.2,
        companyHandle: "c1"
    };



    test("works", async function () {

        let jobId = await db.query(`
            SELECT id FROM jobs WHERE title = 'j1';
        `);

        let id = +jobId.rows[0].id;

        let job = await Job.update(id, updateData);
        expect(job).toEqual({
            id : id,
            title: "j1",
            salary: 120000,
            equity: "0.2",
            companyHandle: "c1"
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'j1'`);
        expect(result.rows).toEqual([{
            title: "j1",
            salary: 120000,
            equity: "0.2",
            companyHandle: "c1"
        }]);
    });


    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "j1",
            salary: 120000,
            equity: null,
            companyHandle: "c1"
        };

        let jobId = await db.query(`
        SELECT id FROM jobs WHERE title = 'j1';
        `);

        let id = +jobId.rows[0].id;

        await Job.update(id, updateDataSetNulls);

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
                FROM jobs
                WHERE title = 'j1'`);

        expect(result.rows).toEqual([{
            title: "j1",
            salary: 120000,
            equity: null,
            companyHandle: "c1"
        }]);
    });



    test("not found if no such job", async function () {
        try {
            await Job.update(12345678, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            let jobId = await db.query(`
            SELECT id FROM jobs WHERE title = 'j1';
            `);
    
            let id = +jobId.rows[0].id;

            await Job.update(id, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {

        let jobId = await db.query(`
        SELECT id FROM jobs WHERE title = 'j1';
        `);

        let id = +jobId.rows[0].id;

        await Job.remove(id);

        const res = await db.query(
            "SELECT title FROM jobs WHERE title = 'j1'");
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(123456789);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
