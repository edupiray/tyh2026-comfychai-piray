const AcceptancePolicy = require("./AcceptancePolicy");

class AcceptanceByCount extends AcceptancePolicy { //clase que implementa la politica de aceptacion por cantidad de papers
    constructor(maxCount) {
        super();
        this._maxCount = maxCount;
    }
    select(papers) {
        const sorted = papers.slice().sort(function(paperA, paperB) { return paperB.score() - paperA.score(); });
        return sorted.slice(0, this._maxCount);
    }
}

module.exports = AcceptanceByCount;
