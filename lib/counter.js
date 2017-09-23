"use strict";

const LENGTH = 100;

function Counter(n) {
    let done = 0;

    this.reportProgress = function() {
        let bar = "[";
        for (let i = 0; i <= LENGTH; i++) {
            if (i <= done / n * LENGTH) {
                bar += "#";
            } else {
                bar += " ";
            }
        }
        bar += "]";
        console.log(done, "/", n);
        console.log(bar);
    };

    this.reportProgress();

    this.increment = function() {
        done++;
        this.reportProgress();
    };
}

module.exports = Counter;
