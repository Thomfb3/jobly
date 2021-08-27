"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobSearchQuery = require("../schemas/jobSearchQuery.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: login
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - minSalary
 * - hasEquity
 * - title Like (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const q = req.query;
  //Convert string to int
  if (q.minSalary !== undefined) q.minSalary = +q.minSalary; 
  if (q.hasEquity === "true") q.hasEquity = true;

  try {
    const validator = jsonschema.validate(q, jobSearchQuery);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const jobs = await Job.findAll(q);    
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  };
});


/** GET /[id]  =>  { job }
 *
 *  Job is { title, salary, equity, companyHandle }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */
router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
