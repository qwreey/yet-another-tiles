
var FakeWindow = class FakeWindow { constructor(){} }

function EqualInEPSILON(resultV,expectedV) {
    const diff = resultV-expectedV
    return diff < Number.EPSILON && diff > -Number.EPSILON
}

module.exports = { FakeWindow, EqualInEPSILON }
