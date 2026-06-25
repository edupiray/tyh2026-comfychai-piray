class AcceptanceByScoreThreshold {
    constructor(minScore) {
        this._minScore = minScore;
    }
    select(papers) {
        const threshold = this._minScore;
        return papers.filter(function(paper) { return paper.score() >= threshold; });
    }
}

module.exports = AcceptanceByScoreThreshold;
