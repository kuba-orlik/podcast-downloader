"use strict";
module.exports = function leftpad(s, length, padder) {
    s = s.toString();
    for (let i = s.length; i < length; i++) {
        s = padder + s;
    }
    return s;
};
