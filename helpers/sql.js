const { BadRequestError } = require("../expressError");


/** sqlForPartialUpdates
 *
 * This function creates a string for a update query
 * 
 * It takes two arguments: 
 * 1.an object with the updated data
 * 2.an object with js names to sql column names
 *
 * It returns an object with two properties
 * 1. setCol: string with the query columns to be updated 
 * 2. values: an array with the new values for each column to be updated
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
