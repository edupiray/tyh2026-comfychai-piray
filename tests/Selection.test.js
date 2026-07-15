// Políticas de aceptación (patrón Strategy): AcceptanceByCount y AcceptanceByScoreThreshold
const Session = require("../src/session/Session");
const User = require("../src/model/User");
const Paper = require("../src/model/Paper");
const AcceptanceByCount = require("../src/policies/AcceptanceByCount");
const AcceptanceByScoreThreshold = require("../src/policies/AcceptanceByScoreThreshold");

let session;

function makeReviewer(name) {
    return new User(name, "UNLP", name + "@test.com", "pass");
}

function makePaper(title, authors) {
    return new Paper(title, authors, authors[0]);
}

function makeScoredPaper(title, score) {
    const author = makeReviewer("author-" + title);
    const paper = makePaper(title, [author]);
    paper._scoreOverride = score;
    return paper;
}

function buildSession(scoredPapers, policy) {
    session = new Session();
    const reviewers = [makeReviewer("rv1"), makeReviewer("rv2"), makeReviewer("rv3")];
    for (const r of reviewers) session.addReviewer(r);
    for (const p of scoredPapers) session.submit(p);
    session.closeSubmissions();
    session.closeBidding();
    for (const paper of scoredPapers) {
        const assigned = session.assignedReviewersFor(paper);
        session.addReview(paper, assigned[0], "review", paper._scoreOverride);
    }
    session.setAcceptancePolicy(policy);
    session.closeReviewing();
}

beforeEach(function() {
    session = new Session();
});

describe("closeReviewing", function() {
    it("advances stage to Selection", function() {
        const paper = makeScoredPaper("P", 1);
        buildSession([paper], new AcceptanceByCount(1));
        expect(session.stage()).toBe("Selection");
    });

    it("does not allow adding reviews after closing", function() {
        const paper = makeScoredPaper("P", 1);
        buildSession([paper], new AcceptanceByCount(1));
        const reviewer = makeReviewer("extra");
        expect(function() {
            session.addReview(paper, reviewer, "late review", 1);
        }).toThrow("Cannot add reviews in Selection stage");
    });

    it("throws if no acceptance policy is set", function() {
        session = new Session();
        const reviewers = [makeReviewer("rv1"), makeReviewer("rv2"), makeReviewer("rv3")];
        for (const r of reviewers) session.addReviewer(r);
        const paper = makeScoredPaper("P", 1);
        session.submit(paper);
        session.closeSubmissions();
        session.closeBidding();
        const assigned = session.assignedReviewersFor(paper);
        session.addReview(paper, assigned[0], "review", 1);
        expect(function() {
            session.closeReviewing();
        }).toThrow("No acceptance policy has been set");
    });
});

describe("AcceptanceByCount", function() {
    it("accepts top N papers by score", function() {
        const papers = [
            makeScoredPaper("P1", 3),
            makeScoredPaper("P2", 2),
            makeScoredPaper("P3", 1),
            makeScoredPaper("P4", 0),
            makeScoredPaper("P5", -1),
        ];
        buildSession(papers, new AcceptanceByCount(3));
        expect(session.acceptedPapers()).toHaveLength(3);
        expect(session.acceptedPapers()).toContain(papers[0]);
        expect(session.acceptedPapers()).toContain(papers[1]);
        expect(session.acceptedPapers()).toContain(papers[2]);
        expect(session.acceptedPapers()).not.toContain(papers[3]);
        expect(session.acceptedPapers()).not.toContain(papers[4]);
    });

    it("accepts all papers when count exceeds total", function() {
        const papers = [
            makeScoredPaper("P1", 3),
            makeScoredPaper("P2", 1),
        ];
        buildSession(papers, new AcceptanceByCount(10));
        expect(session.acceptedPapers()).toHaveLength(2);
    });

    it("accepts zero papers when count is 0", function() {
        const papers = [
            makeScoredPaper("P1", 3),
            makeScoredPaper("P2", 1),
        ];
        buildSession(papers, new AcceptanceByCount(0));
        expect(session.acceptedPapers()).toHaveLength(0);
    });

    it("selects papers in descending score order", function() {
        const papers = [
            makeScoredPaper("P-low", -2),
            makeScoredPaper("P-high", 3),
            makeScoredPaper("P-mid", 1),
        ];
        buildSession(papers, new AcceptanceByCount(2));
        expect(session.acceptedPapers()).toContain(papers[1]);
        expect(session.acceptedPapers()).toContain(papers[2]);
        expect(session.acceptedPapers()).not.toContain(papers[0]);
    });

    it("accepts exactly 1 paper when count is 1", function() {
        const papers = [
            makeScoredPaper("P1", 2),
            makeScoredPaper("P2", 3),
            makeScoredPaper("P3", 1),
        ];
        buildSession(papers, new AcceptanceByCount(1));
        expect(session.acceptedPapers()).toHaveLength(1);
        expect(session.acceptedPapers()).toContain(papers[1]);
    });
});

describe("AcceptanceByScoreThreshold", function() {
    it("accepts all papers with score >= threshold", function() {
        const papers = [
            makeScoredPaper("P1", 3),
            makeScoredPaper("P2", 2),
            makeScoredPaper("P3", 0),
            makeScoredPaper("P4", -1),
            makeScoredPaper("P5", -3),
        ];
        buildSession(papers, new AcceptanceByScoreThreshold(1));
        expect(session.acceptedPapers()).toHaveLength(2);
        expect(session.acceptedPapers()).toContain(papers[0]);
        expect(session.acceptedPapers()).toContain(papers[1]);
    });

    it("accepts no papers when threshold is very high", function() {
        const papers = [
            makeScoredPaper("P1", 3),
            makeScoredPaper("P2", 2),
        ];
        buildSession(papers, new AcceptanceByScoreThreshold(10));
        expect(session.acceptedPapers()).toHaveLength(0);
    });

    it("accepts all papers when threshold is very low", function() {
        const papers = [
            makeScoredPaper("P1", 1),
            makeScoredPaper("P2", -1),
            makeScoredPaper("P3", -3),
        ];
        buildSession(papers, new AcceptanceByScoreThreshold(-3));
        expect(session.acceptedPapers()).toHaveLength(3);
    });

    it("includes papers with score exactly equal to threshold", function() {
        const papers = [
            makeScoredPaper("P1", 2),
            makeScoredPaper("P2", 1),
            makeScoredPaper("P3", 0),
        ];
        buildSession(papers, new AcceptanceByScoreThreshold(1));
        expect(session.acceptedPapers()).toHaveLength(2);
        expect(session.acceptedPapers()).toContain(papers[0]);
        expect(session.acceptedPapers()).toContain(papers[1]);
        expect(session.acceptedPapers()).not.toContain(papers[2]);
    });

    it("accepts no papers when all scores are below threshold", function() {
        const papers = [
            makeScoredPaper("P1", -1),
            makeScoredPaper("P2", -2),
        ];
        buildSession(papers, new AcceptanceByScoreThreshold(0));
        expect(session.acceptedPapers()).toHaveLength(0);
    });

    it("works with threshold of 0", function() {
        const papers = [
            makeScoredPaper("P1", 2),
            makeScoredPaper("P2", 0),
            makeScoredPaper("P3", -1),
        ];
        buildSession(papers, new AcceptanceByScoreThreshold(0));
        expect(session.acceptedPapers()).toHaveLength(2);
        expect(session.acceptedPapers()).toContain(papers[0]);
        expect(session.acceptedPapers()).toContain(papers[1]);
    });
});

describe("Acceptance policy can be changed per session", function() {
    it("different sessions can use different policies", function() {
        const papers1 = [
            makeScoredPaper("A1", 3),
            makeScoredPaper("A2", 2),
            makeScoredPaper("A3", -1),
        ];
        buildSession(papers1, new AcceptanceByCount(2));
        const session1 = session;

        const papers2 = [
            makeScoredPaper("B1", 3),
            makeScoredPaper("B2", 2),
            makeScoredPaper("B3", -1),
        ];
        buildSession(papers2, new AcceptanceByScoreThreshold(0));
        const session2 = session;

        expect(session1.acceptedPapers()).toHaveLength(2);
        expect(session2.acceptedPapers()).toHaveLength(2);
    });
});
