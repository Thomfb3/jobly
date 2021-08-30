"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns { title, salary, equity, company_handle }
     *
     * */

    static async create({ title, salary, equity, companyHandle }) {
        // const duplicateCheck = await db.query(
        //       `SELECT handle
        //        FROM companies
        //        WHERE handle = $1`,
        //     [handle]);

        // if (duplicateCheck.rows[0])
        //   throw new BadRequestError(`Duplicate company: ${handle}`);

        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle
            ],
        );

        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     *
     * Returns [{ title, salary, equity, companyHandle }, ...]
     * 
     * Can filter by search query:
     * - title LIKE query
     * - minSalary
     * - hasEquity
     * */

    static async findAll(searchFilters = {}) {
        let query = `SELECT title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs`;

        let whereExpressions = [];
        let queryValues = [];

        const { minSalary, hasEquity, title } = searchFilters;

        //Add each search term to whereExpressions and queryValues
        if (minSalary !== undefined) {
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`);
        };

        if (hasEquity !== undefined && hasEquity === true) {
            queryValues.push(0)
            whereExpressions.push(`equity > $${queryValues.length}`);
        };

        if (title) {
            queryValues.push(`%${title}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
        };

        //Add where if whereExpressions is not empty
        if (whereExpressions.length > 0) {
            query += ` WHERE ${whereExpressions.join(" AND ")}`;
        };

        //ORDER BY title
        query += " ORDER BY title";

        //await query and return results
        const jobsRes = await db.query(query, queryValues)
        return jobsRes.rows;
    }

    /** Given a job id, return data about the job.
     *
     * Returns { title, salary, equity, companyHandle }
     *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
             FROM jobs
             WHERE jobs.id = $1`,
             [id]);
        
        // const company_handle = jobRes.rows[0].companyHandle;

        // const companyNameRes = await db.query(
        //     `SELECT name 
        //      FROM companies 
        //      WHERE handle = $1`,
        //     [company_handle]);

        //const job = { "job" : jobRes.rows[0], "company" : companyNameRes.rows[0] };

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: { title, salary, equity, companyHandle }
     *
     * Returns { title, salary, equity, companyHandle }
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                companyHandle: "company_handle"
            });

        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;

        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job id: ${id}`);

        return job;
    }


    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job id: ${id}`);
    };


}


module.exports = Job;
