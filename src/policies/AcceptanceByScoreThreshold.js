const AcceptancePolicy = require("./AcceptancePolicy");

class AcceptanceByScoreThreshold extends AcceptancePolicy { //clase que implementa la politica de aceptacion por puntaje minimo
    constructor(minScore) {
        super();
        this._minScore = minScore;
    }
    select(papers) {
        const threshold = this._minScore;
        return papers.filter(function(paper) { return paper.score() >= threshold; });
    }
}

module.exports = AcceptanceByScoreThreshold;
