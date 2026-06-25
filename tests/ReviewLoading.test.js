const Session = require("../src/session/Session");
const User = require("../src/model/User");
const Paper = require("../src/model/Paper");
const { Interests } = require("../src/model/Bid");

let session;
let r1, r2, r3, r4;
let p1;

function makeReviewer(name) {
    return new User(name, "UNLP", name + "@test.com", "pass");
}

function makePaper(title, authors) {
    return new Paper(title, authors, authors[0]);
}

function setupSessionInAssignmentStage(reviewers, papers) {
    for(const r of reviewers) session.addReviewer(r);
    for(const p of papers) session.submit(p);
    session.closeSubmissions();
    session.closeBidding();
}

beforeEach(function() {
    session = new Session();
    r1 = makeReviewer("r1");
    r2 = makeReviewer("r2");
    r3 = makeReviewer("r3");
    r4 = makeReviewer("r4");
    const author = makeReviewer("author");
    p1 = makePaper("Paper 1", [author]);
    setupSessionInAssignmentStage([r1, r2, r3], [p1]);
});

describe("addReview — happy path", function() {
    it.each([
        ["positive score", 3],
        ["zero score",     0],
        ["negative score", -3],
    ])("assigned reviewer can add a valid review with %s", function(_, score) {
        const reviewer = session.assignedReviewersFor(p1)[0];
        expect(function() {
            session.addReview(p1, reviewer, "Good paper", score);
        }).not.toThrow();
        expect(p1.reviewsCount()).toBe(1);
    });

    it("all 3 assigned reviewers can submit their reviews", function() {
        const assigned = session.assignedReviewersFor(p1);
        session.addReview(p1, assigned[0], "Review A", 2);
        session.addReview(p1, assigned[1], "Review B", 1);
        session.addReview(p1, assigned[2], "Review C", -1);
        expect(p1.reviewsCount()).toBe(3);
    });

    it("paper score is the average of submitted review scores", function() {
        const assigned = session.assignedReviewersFor(p1);
        session.addReview(p1, assigned[0], "Review A", 3);
        session.addReview(p1, assigned[1], "Review B", 0);
        session.addReview(p1, assigned[2], "Review C", -3);
        expect(p1.score()).toBe(0);
    });
});

describe("addReview — stage validation", function() {
    it("throws if stage is Receiving", function() {
        const freshSession = new Session();
        const author = makeReviewer("author2");
        const paper = makePaper("Paper X", [author]);
        freshSession.addReviewer(r4);
        freshSession.submit(paper);
        expect(function() {
            freshSession.addReview(paper, r4, "Too early", 1);
        }).toThrow("Cannot add reviews in Receiving stage");
    });

    it("throws if stage is Bidding", function() {
        const freshSession = new Session();
        const author = makeReviewer("author3");
        const paper = makePaper("Paper Y", [author]);
        freshSession.addReviewer(r4);
        freshSession.submit(paper);
        freshSession.closeSubmissions();
        expect(function() {
            freshSession.addReview(paper, r4, "Too early", 1);
        }).toThrow("Cannot add reviews in Bidding stage");
    });
});

describe("addReview — reviewer assignment validation", function() {
    it("throws if reviewer is not assigned to the paper", function() {
        expect(function() {
            session.addReview(p1, r4, "Not assigned", 1);
        }).toThrow("Reviewer is not assigned to this paper");
    });
});

describe("addReview — duplicate review validation", function() {
    it("throws if reviewer already submitted a review for the paper", function() {
        const reviewer = session.assignedReviewersFor(p1)[0];
        session.addReview(p1, reviewer, "First review", 2);
        expect(function() {
            session.addReview(p1, reviewer, "Second review", 1);
        }).toThrow("Reviewer already submitted a review for this paper");
    });
});

describe("addReview — score validation", function() {
    it("throws if score is greater than 3", function() {
        const reviewer = session.assignedReviewersFor(p1)[0];
        expect(function() {
            session.addReview(p1, reviewer, "Out of range", 4);
        }).toThrow("Score must be an integer between -3 and +3");
    });

    it("throws if score is less than -3", function() {
        const reviewer = session.assignedReviewersFor(p1)[0];
        expect(function() {
            session.addReview(p1, reviewer, "Out of range", -4);
        }).toThrow("Score must be an integer between -3 and +3");
    });

    it("throws if score is not an integer", function() {
        const reviewer = session.assignedReviewersFor(p1)[0];
        expect(function() {
            session.addReview(p1, reviewer, "Decimal score", 1.5);
        }).toThrow("Score must be an integer between -3 and +3");
    });

    it.each([
        [ 4,   "out of range (above)"],
        [-4,   "out of range (below)"],
        [ 1.5, "decimal"],
        [-2.9, "negative decimal"],
    ])("rejects score %f — %s", function(score, _desc) {
        const reviewer = session.assignedReviewersFor(p1)[0];
        expect(function() {
            session.addReview(p1, reviewer, "text", score);
        }).toThrow("Score must be an integer between -3 and +3");
    });
});

describe("addReview — max reviews per paper", function() {
    it("throws when attempting a 4th review on a paper that already has 3", function() {
        const author4 = makeReviewer("author4");
        const paper4 = makePaper("Paper 4", [author4]);
        const extraSession = new Session();
        const rx1 = makeReviewer("rx1");
        const rx2 = makeReviewer("rx2");
        const rx3 = makeReviewer("rx3");
        const rx4 = makeReviewer("rx4");
        extraSession.addReviewer(rx1);
        extraSession.addReviewer(rx2);
        extraSession.addReviewer(rx3);
        extraSession.addReviewer(rx4);
        extraSession.submit(paper4);
        extraSession.closeSubmissions();
        extraSession.closeBidding();

        const assigned = extraSession.assignedReviewersFor(paper4);
        extraSession.addReview(paper4, assigned[0], "Review 1", 1);
        extraSession.addReview(paper4, assigned[1], "Review 2", 2);
        extraSession.addReview(paper4, assigned[2], "Review 3", -1);

        expect(function() {
            extraSession.addReview(paper4, rx4, "Review 4", 0);
        }).toThrow();
    });
});
