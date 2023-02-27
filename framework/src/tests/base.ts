import 'mocha';
import { expect } from 'chai';
import { Reporter } from '../reporter';

/**
 * Base class for all tests. This class is responsible for running the tests and reporting the results.
 * 
 * You should extend this class and implement the tests method. The tests method will be called with the describe and it functions
 * that you can use to define your tests.
 * 
 * To run the tests, call the run method. This method will return a promise that will resolve with the results of the tests.
 */
export abstract class BaseTest {
    
    abstract title: string;

    constructor() {
        
    }

    run() {
        return new Promise<any>((resolve, reject) => {
            let res = {};
            const mocha = this.createMocha(x => res = x);
            const root = mocha.suite;
            let context: Mocha.Suite | undefined = root;
            
            // define the describe and it functions that will be used to populate the tests
            const describe = (name: string, fn: () => any) => {
                const suite = new Mocha.Suite(name);
                context?.addSuite(suite);
                context = suite;

                fn();
                context = suite.parent;
            };

            const it = (name: string, fn: Mocha.Func) => {
                context?.addTest(new Mocha.Test(name, fn));
            };

            // create the tests
            this.tests(describe, it, expect);

            // run the tests
            mocha.run().on('end', () => {
                resolve(res);
            });
        });
    }

    abstract tests(describe: (suiteTitle: string, func: () => void) => void, it: (name: string, fn: Mocha.Func) => void, expect: Chai.ExpectStatic): void;

    private createMocha(callback: (res: any) => void) {
        const mocha = new Mocha({
            reporter: Reporter,
            reporterOptions: {
                callback
            },
            // max timeout should be less than 10 minutes because of Async endpoints timeout at 10 minutes
            timeout: 595000, 
        });

        return mocha;
    }
}