const Session = require("../src/Session");
const User = require("../src/User");
const Paper = require("../src/Paper");
const { Bid, Interests } = require("../src/Bid");

let session;
let r1, r2, r3, r4, r5;
let p1, p2, p3;

function makeReviewer(name) {
    return new User(name, "UNLP", name + "@test.com", "pass");
}

function makePaper(title, authors) {
    return new Paper(title, authors, authors[0]);
}

function setupSessionWithReviewersAndPapers(reviewers, papers) {
    for(const r of reviewers) session.addReviewer(r);
    for(const p of papers) session.submit(p);
    session.closeSubmissions();
}

beforeEach(function() {
    session = new Session();
    r1 = makeReviewer("r1");
    r2 = makeReviewer("r2");
    r3 = makeReviewer("r3");
    r4 = makeReviewer("r4");
    r5 = makeReviewer("r5");
    p1 = makePaper("Paper 1", [r4]);
    p2 = makePaper("Paper 2", [r5]);
    p3 = makePaper("Paper 3", [r4, r5]);
});

describe("closeBidding", function() {
    it("advances stage to Assignment", function() {
        setupSessionWithReviewersAndPapers([r1, r2, r3], [p1, p2, p3]);
        session.closeBidding();
        expect(session.stage()).toBe("Assignment");
    });

    it("does not allow new bids after closing", function() {
        setupSessionWithReviewersAndPapers([r1, r2, r3], [p1, p2, p3]);
        session.closeBidding();
        function attemptBid() { session.enterBid(p1, r1, Interests.Interested); }
        expect(attemptBid).toThrow();
    });
});

describe("Reviewer assignment — load distribution", function() {
    it("assigns exactly 3 reviewers per paper", function() {
        setupSessionWithReviewersAndPapers([r1, r2, r3], [p1, p2, p3]);
        session.closeBidding();
        expect(session.assignedReviewersFor(p1)).toHaveLength(3);
        expect(session.assignedReviewersFor(p2)).toHaveLength(3);
        expect(session.assignedReviewersFor(p3)).toHaveLength(3);
    });

    it.each([
        [3, 1],
        [3, 3],
        [4, 5],
        [5, 10],
        [7, 10],
    ])("assigns exactly 3 reviewers per paper with %i reviewers and %i papers",
    function(numReviewers, numPapers) {
        const reviewers = [];
        for(let i = 0; i < numReviewers; i++){
            reviewers.push(makeReviewer("r" + i));
        }
        const papers = [];
        for(let i = 0; i < numPapers; i++){
            papers.push(makePaper("Paper " + i, [makeReviewer("author" + i)]));
        }
        setupSessionWithReviewersAndPapers(reviewers, papers);
        session.closeBidding();

        console.log("--- Assignment table [" + numReviewers + " reviewers / " + numPapers + " papers] ---");
        for(const p of papers){
            const names = session.assignedReviewersFor(p).map(function(r) { return r.fullName; });
            console.log("  " + p.title() + " → " + names.join(", "));
            expect(session.assignedReviewersFor(p)).toHaveLength(3);
        }
    });

    it.each([
        [7, 10],
        [3,  3],
        [4,  3],
        [5,  4],
        [6,  5],
        [3, 10],
    ])("distributes review load evenly with %i reviewers and %i papers",
    function(numReviewers, numPapers) {
        const reviewers = [];
        for(let i = 0; i < numReviewers; i++){
            reviewers.push(makeReviewer("r" + i));
        }
        const papers = [];
        for(let i = 0; i < numPapers; i++){
            papers.push(makePaper("Paper " + i, [makeReviewer("author" + i)]));
        }
        setupSessionWithReviewersAndPapers(reviewers, papers);
        session.closeBidding();

        const total = 3 * numPapers;
        const base = Math.floor(total / numReviewers);
        const extra = total % numReviewers;

        const withExtra = [];
        const withBase = [];
        console.log("--- Load distribution [" + numReviewers + " reviewers / " + numPapers + " papers | base=" + base + ", extra=" + extra + "] ---");
        for(const r of reviewers){
            let count = 0;
            for(const p of papers){
                if(session.assignedReviewersFor(p).includes(r)) count++;
            }
            console.log("  " + r.fullName + ": " + count + " assignments");
            if(count === base + 1) withExtra.push(r);
            if(count === base) withBase.push(r);
        }
        expect(withExtra).toHaveLength(extra);
        expect(withBase).toHaveLength(numReviewers - extra);
    });
});

describe("Reviewer assignment — bid priority", function() {
    // 3 papers, 3 reviewers, each reviewer has cap 3 (all assigned to all papers)
    // Priority is verified through per-paper bid analysis

    it("prefers Interested over Maybe", function() {
        setupSessionWithReviewersAndPapers([r1, r2, r3], [p1, p2, p3]);
        session.enterBid(p1, r1, Interests.Maybe);
        session.enterBid(p1, r2, Interests.Interested);
        session.enterBid(p1, r3, Interests.NotInterested);
        session.closeBidding();
        // r2 (Interested) must be assigned before r1 (Maybe) which must be before r3 (NotInterested)
        const assigned = session.assignedReviewersFor(p1);
        expect(assigned).toContain(r1);
        expect(assigned).toContain(r2);
        expect(assigned).toContain(r3);
        expect(assigned.indexOf(r2)).toBeLessThan(assigned.indexOf(r1));
        expect(assigned.indexOf(r1)).toBeLessThan(assigned.indexOf(r3));
    });

    it("prefers Maybe over no bid (implicit)", function() {
        setupSessionWithReviewersAndPapers([r1, r2, r3], [p1, p2, p3]);
        session.enterBid(p1, r1, Interests.Maybe);
        // r2 and r3 have no bid
        session.closeBidding();
        const assigned = session.assignedReviewersFor(p1);
        expect(assigned).toContain(r1);
        expect(assigned.indexOf(r1)).toBeLessThan(assigned.indexOf(r2));
        expect(assigned.indexOf(r1)).toBeLessThan(assigned.indexOf(r3));
    });

    it("prefers no bid over explicit NotInterested", function() {
        setupSessionWithReviewersAndPapers([r1, r2, r3], [p1, p2, p3]);
        session.enterBid(p1, r1, Interests.NotInterested);
        // r2 and r3 have no bid
        session.closeBidding();
        const assigned = session.assignedReviewersFor(p1);
        expect(assigned).toContain(r1);
        expect(assigned.indexOf(r2)).toBeLessThan(assigned.indexOf(r1));
        expect(assigned.indexOf(r3)).toBeLessThan(assigned.indexOf(r1));
    });

    it("falls back to lower priority groups when higher priority is exhausted", function() {
        // Only r1 is Interested in p1; r2 and r3 have no bid → must fill with no-bid reviewers
        setupSessionWithReviewersAndPapers([r1, r2, r3], [p1, p2, p3]);
        session.enterBid(p1, r1, Interests.Interested);
        session.closeBidding();
        const assigned = session.assignedReviewersFor(p1);
        expect(assigned).toHaveLength(3);
        expect(assigned).toContain(r1);
    });
});

describe("Reviewer assignment — conflict of interest", function() {
    it("excludes a reviewer who is author of the paper", function() {
        const author = makeReviewer("author-reviewer");
        const paper = makePaper("COI Paper", [author]);
        session.addReviewer(r1);
        session.addReviewer(r2);
        session.addReviewer(r3);
        session.addReviewer(author);
        session.submit(paper);
        session.closeSubmissions();
        session.enterBid(paper, author, Interests.Interested);
        session.closeBidding();

        const assigned = session.assignedReviewersFor(paper);
        expect(assigned).toHaveLength(3);
        expect(assigned).not.toContain(author);
    });

    it("excludes a reviewer with Conflict bid", function() {
        const externalAuthor = makeReviewer("external");
        const conflictPaper = makePaper("Conflict Paper", [externalAuthor]);
        session.addReviewer(r1);
        session.addReviewer(r2);
        session.addReviewer(r3);
        session.addReviewer(r4);
        session.submit(conflictPaper);
        session.submit(p1);
        session.submit(p2);
        session.closeSubmissions();
        session.enterBid(conflictPaper, r1, Interests.Conflict);
        session.closeBidding();

        const assigned = session.assignedReviewersFor(conflictPaper);
        expect(assigned).not.toContain(r1);
        expect(assigned).toHaveLength(3);
    });
});
