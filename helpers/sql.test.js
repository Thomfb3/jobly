"use strict";

const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");



describe("sqlForPartialUpdate", function () {
    test("test sqlForPartialUpdate standard user update", function () {
        const data = {
            "firstName": "Tom",
            "lastName": "Thompson",
            "isAdmin": false
        }
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                firstName: "first_name",
                lastName: "last_name",
                isAdmin: "is_admin",
            };
        );
        expect(setCols).toEqual(`"first_name"=$1, "last_name"=$2, "is_admin"=$3`);
        expect(values).toEqual(["Tom", "Thompson", false]);
    });



    test("test sqlForPartialUpdate random input", function () {

        const data = {
            "columnOne": "string",
            "columnTwo": 123,
            "columnThree": true
        };
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                columnOne: "column_one",
                columnTwo: "column_two",
                columnThree: "column_three",
            }
        );
        expect(setCols).toEqual(`"column_one"=$1, "column_two"=$2, "column_three"=$3`);
        expect(values).toEqual(["string", 123, true]);
    });


    
    test("test sqlForPartialUpdate bad data", function () {
        try {
            const data = {}
            sqlForPartialUpdate(
                data,
                {
                    columnOne: "column_one",
                    columnTwo: "column_two",
                    columnThree: "column_three",
                }
            );
        } catch (e) {
            expect(e).toBeInstanceOf(BadRequestError);
            expect(e.message).toBe("No data");
        }

    });

});