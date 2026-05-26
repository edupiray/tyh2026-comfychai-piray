const Session = require("../src/Session");
const User = require("../src/User");
const Paper = require("../src/Paper");

let session;

function makeReviewer(name) {
    return new User(name, "UNLP", name + "@test.com", "pass");
}

function makePaper(title, authors) {
    return new Paper(title, authors, authors[0]);
}

function setupSessionInSelectionStage(papers, rate) {
    const reviewers = [makeReviewer("r1"), makeReviewer("r2"), makeReviewer("r3")];
    for(const r of reviewers) session.addReviewer(r);
    for(const p of papers) session.submit(p);
    session.closeSubmissions();
    session.closeBidding();

    const scores = papers.map(function(p) { return p._scoreOverride; });
    for(const paper of papers) {
        const assigned = session.assignedReviewersFor(paper);
        session.addReview(paper, assigned[0], "review", paper._scoreOverride);
    }

    if(rate !== undefined) session.setAcceptanceRate(rate);
    session.closeReviewing();
}

function makeScoredPaper(title, score) {
    const author = makeReviewer("author-" + title);
    const paper = makePaper(title, [author]);
    paper._scoreOverride = score;
    return paper;
}

function buildSession(scoredPapers, rate) {
    session = new Session();
    const reviewers = [makeReviewer("rv1"), makeReviewer("rv2"), makeReviewer("rv3")];
    for(const r of reviewers) session.addReviewer(r);
    for(const p of scoredPapers) session.submit(p);
    session.closeSubmissions();
    session.closeBidding();
    for(const paper of scoredPapers) {
        const assigned = session.assignedReviewersFor(paper);
        session.addReview(paper, assigned[0], "review", paper._scoreOverride);
    }
    if(rate !== undefined) session.setAcceptanceRate(rate);
    session.closeReviewing();
}

beforeEach(function() {
    session = new Session();
});

describe("closeReviewing", function() {
    it("advances stage to Selection", function() {
        const author = makeReviewer("a");
        const paper = makePaper("P", [author]);
        paper._scoreOverride = 1;
        buildSession([paper], 50);
        expect(session.stage()).toBe("Selection");
    });

    it("does not allow adding reviews after closing", function() {
        const author = makeReviewer("a");
        const paper = makePaper("P", [author]);
        paper._scoreOverride = 1;
        buildSession([paper], 50);
        const reviewer = makeReviewer("extra");
        expect(function() {
            session.addReview(paper, reviewer, "late review", 1);
        }).toThrow("Reviews can only be added during Assignment stage");
    });
});

describe("selectPapers — basic cutoff", function() {
    it("accepts top 50% of papers by score (10 papers → 5 accepted)", function() {
        const papers = [
            makeScoredPaper("P1", 3),
            makeScoredPaper("P2", 2),
            makeScoredPaper("P3", 2),
            makeScoredPaper("P4", 1),
            makeScoredPaper("P5", 1),
            makeScoredPaper("P6", 0),
            makeScoredPaper("P7", 0),
            makeScoredPaper("P8", -1),
            makeScoredPaper("P9", -2),
            makeScoredPaper("P10", -3),
        ];
        buildSession(papers, 50);
        expect(session.acceptedPapers()).toHaveLength(5);
        expect(session.acceptedPapers()).toContain(papers[0]);
        expect(session.acceptedPapers()).not.toContain(papers[9]);
    });

    it("rounds cutoff up (11 papers at 50% → 6 accepted)", function() {
        const papers = [];
        for(let i = 0; i < 11; i++) papers.push(makeScoredPaper("P" + i, Math.max(-3, 3 - i)));
        buildSession(papers, 50);
        expect(session.acceptedPapers()).toHaveLength(6);
    });

    it("accepts no papers when rate is 0%", function() {
        const papers = [makeScoredPaper("P1", 3), makeScoredPaper("P2", 1)];
        buildSession(papers, 0);
        expect(session.acceptedPapers()).toHaveLength(0);
    });

    it("accepts all papers when rate is 100%", function() {
        const papers = [makeScoredPaper("P1", 3), makeScoredPaper("P2", 1), makeScoredPaper("P3", -1)];
        buildSession(papers, 100);
        expect(session.acceptedPapers()).toHaveLength(3);
    });
});

describe("selectPapers — rate combinations", function() {
    it.each([
        [10, 50,  5],
        [10, 30,  3],
        [10, 20,  2],
        [ 7, 50,  4],
        [20, 25,  5],
    ])("%i papers at %i%% → %i accepted", function(total, rate, expected) {
        const papers = [];
        for(let i = 0; i < total; i++) papers.push(makeScoredPaper("P" + i, Math.max(-3, 3 - i)));
        buildSession(papers, rate);
        expect(session.acceptedPapers()).toHaveLength(expected);
    });
});

describe("selectPapers — tie breaking at boundary", function() {
    it("extends to include tied papers when result stays within 60% cap", function() {
        // 10 papers, 50% rate → cutoff = 5
        // papers[4] and papers[5] share same score → extend to 6 (60% of 10 = 6, OK)
        const papers = [
            makeScoredPaper("P1", 3),
            makeScoredPaper("P2", 2),
            makeScoredPaper("P3", 2),
            makeScoredPaper("P4", 1),
            makeScoredPaper("P5", 0),
            makeScoredPaper("P6", 0),
            makeScoredPaper("P7", -1),
            makeScoredPaper("P8", -1),
            makeScoredPaper("P9", -2),
            makeScoredPaper("P10", -3),
        ];
        buildSession(papers, 50);
        // cutoff=5: P1-P5 accepted, P6 ties with P5 → 6 total ≤ ceil(10*0.6)=6 → extend
        expect(session.acceptedPapers()).toHaveLength(6);
        expect(session.acceptedPapers()).toContain(papers[5]);
    });

    it("does not extend when tied group would exceed 60% cap", function() {
        // 10 papers, 30% rate → cutoff = 3
        // papers[3..6] all share score 0 → extending to 7 = 70% > 60% → no extension
        const papers = [
            makeScoredPaper("P1", 3),
            makeScoredPaper("P2", 2),
            makeScoredPaper("P3", 1),
            makeScoredPaper("P4", 0),
            makeScoredPaper("P5", 0),
            makeScoredPaper("P6", 0),
            makeScoredPaper("P7", 0),
            makeScoredPaper("P8", -1),
            makeScoredPaper("P9", -2),
            makeScoredPaper("P10", -3),
        ];
        buildSession(papers, 30);
        expect(session.acceptedPapers()).toHaveLength(3);
        expect(session.acceptedPapers()).not.toContain(papers[3]);
    });
});
