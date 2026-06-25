class AcceptanceByCount {
    constructor(maxCount) {
        this._maxCount = maxCount;
    }
    select(papers) {
        const sorted = papers.slice().sort(function(a, b) { return b.score() - a.score(); });
        return sorted.slice(0, this._maxCount);
    }
}

module.exports = AcceptanceByCount;
